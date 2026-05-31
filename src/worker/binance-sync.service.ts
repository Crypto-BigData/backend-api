import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import type { ClickHouseClient } from '@clickhouse/client';
import type Redis from 'ioredis';

import { CLICKHOUSE_CLIENT } from '../config/clickhouse.module';
import { REDIS_CLIENT } from '../config/redis.module';
import { WorkerKlineService } from './worker-kline.service';
import type { KlineRow } from './worker-kline.service';
import { RedisLock } from '../common/utils/redis-lock';
import { batchExecute, sleep } from '../common/utils/concurrency';
import {
  getFutureTickers,
  getFuturesKlines,
  alignTimestamp,
} from '../common/utils/binance.adapter';
import {
  DEFAULT_INTERVAL,
  DEFAULT_INTERVAL_MS,
  MAX_CANDLES_PER_REQUEST,
  RedisKey,
} from '../common/utils/constants';

/** Lock TTL gần sát chu kỳ cron để tránh deadlock lâu */
const SYNC_NEW_LOCK_TTL = 50;   // 50s < 60s cycle
const SYNC_OLD_LOCK_TTL = 170;  // 170s < 180s cycle

/** Concurrency limit cho batch fetch nhiều tickers song song */
const TICKER_CONCURRENCY = 10;

/** Delay giữa mỗi ticker request — tránh Binance rate limit */
const INTER_TICKER_DELAY_MS = 100;

@Injectable()
export class BinanceSyncService implements OnModuleInit {
  private readonly logger = new Logger(BinanceSyncService.name);
  private backfillCutoffMs: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(CLICKHOUSE_CLIENT) private readonly clickhouse: ClickHouseClient,
    private readonly workerKlineService: WorkerKlineService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const months = this.configService.get<number>('BACKFILL_MONTHS', 6);
    this.backfillCutoffMs = Date.now() - months * 30 * 24 * 60 * 60 * 1000;

    // Release stale locks on startup (crash recovery)
    await RedisLock.releaseLock(this.redis, RedisKey.LOCK_SYNC_NEW_KLINE);
    await RedisLock.releaseLock(this.redis, RedisKey.LOCK_SYNC_OLD_KLINE);
    this.logger.log(`Backfill cutoff: ${new Date(this.backfillCutoffMs).toISOString()}`);
  }

  // ─── Format Binance raw array → KlineRow object ────────────────────
  private formatKlines(ticker: string, rawData: any[][]): KlineRow[] {
    return rawData.map((item) => ({
      ticker,
      openTime: item[0],
      open: String(item[1]),
      high: String(item[2]),
      low: String(item[3]),
      close: String(item[4]),
      volume: String(item[5]),
      closeTime: item[6],
      quoteAssetVolume: String(item[7]),
      numOfTrades: Number(item[8]),
      takerBuyBaseAssetVolume: String(item[9]),
      takerBuyQuoteAssetVolume: String(item[10]),
      ignore: String(item[11]),
    }));
  }

  // ─── CronJob 1: Sync danh sách Futures tickers (mỗi 5 phút) ───────
  @Cron('*/5 * * * *')
  async syncTickers(): Promise<void> {
    try {
      this.logger.log('syncTickers: fetching ticker list from Binance...');
      const tickers = await getFutureTickers();
      const symbols = tickers.map((t) => t.symbol);
      await this.redis.set(RedisKey.BINANCE_TICKERS, symbols.join(','));
      this.logger.log(`syncTickers: saved ${symbols.length} tickers to Redis`);
    } catch (err) {
      this.logger.error(
        'syncTickers failed',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  // ─── CronJob 2: Sync klines MỚI NHẤT (mỗi phút) ──────────────────
  @Cron('* * * * *')
  async syncNewKlines(): Promise<void> {
    const locked = await RedisLock.setLock(
      this.redis,
      RedisKey.LOCK_SYNC_NEW_KLINE,
      SYNC_NEW_LOCK_TTL,
    ).catch(() => false);

    if (!locked) return;

    try {
      this.logger.log('syncNewKlines: start');
      const nowMs = Date.now();

      const rawSymbols = await this.redis.get(RedisKey.BINANCE_TICKERS);
      if (!rawSymbols) {
        this.logger.warn('syncNewKlines: no tickers in Redis — skipping');
        return;
      }
      const symbols = rawSymbols.split(',');

      // Lấy checkpoint mới nhất cho từng ticker từ ClickHouse
      const checkpointMap = await this.getNewestCheckpoints();

      const allKlines: KlineRow[] = [];

      const tasks = symbols.map((ticker) => async () => {
        const checkpoint =
          checkpointMap[ticker] ??
          nowMs - DEFAULT_INTERVAL_MS * MAX_CANDLES_PER_REQUEST;

        const limit = Math.min(
          Math.ceil((nowMs - checkpoint) / DEFAULT_INTERVAL_MS) + 1,
          MAX_CANDLES_PER_REQUEST,
        );

        try {
          const rawKlines = await getFuturesKlines(
            ticker,
            DEFAULT_INTERVAL,
            alignTimestamp(checkpoint, DEFAULT_INTERVAL_MS),
            limit,
          );
          allKlines.push(...this.formatKlines(ticker, rawKlines));
        } catch (err) {
          this.logger.warn(`syncNewKlines: failed for ${ticker} — ${err}`);
        }

        await sleep(INTER_TICKER_DELAY_MS);
      });

      await batchExecute(tasks, TICKER_CONCURRENCY);
      await this.workerKlineService.handleSaveKlines5m(allKlines);

      this.logger.log(
        `syncNewKlines: done — ${allKlines.length} klines from ${symbols.length} tickers`,
      );
    } catch (err) {
      this.logger.error(
        'syncNewKlines failed',
        err instanceof Error ? err.stack : String(err),
      );
    } finally {
      await RedisLock.releaseLock(this.redis, RedisKey.LOCK_SYNC_NEW_KLINE);
    }
  }

  // ─── CronJob 3: Backfill klines CŨ (mỗi 3 phút) ──────────────────
  @Cron('*/3 * * * *')
  async syncOldKlines(): Promise<void> {
    const locked = await RedisLock.setLock(
      this.redis,
      RedisKey.LOCK_SYNC_OLD_KLINE,
      SYNC_OLD_LOCK_TTL,
    ).catch(() => false);

    if (!locked) return;

    try {
      this.logger.log('syncOldKlines: start');

      const rawSymbols = await this.redis.get(RedisKey.BINANCE_TICKERS);
      if (!rawSymbols) {
        this.logger.warn('syncOldKlines: no tickers in Redis — skipping');
        return;
      }
      const symbols = rawSymbols.split(',');

      // Lấy checkpoint cũ nhất cho từng ticker
      const checkpointMap = await this.getOldestCheckpoints();

      const allKlines: KlineRow[] = [];

      const tasks = symbols.map((ticker) => async () => {
        const checkpoint =
          checkpointMap[ticker] ??
          Date.now();

        // Dừng backfill nếu đã đạt cutoff
        if (checkpoint <= this.backfillCutoffMs) return;

        const startTime = alignTimestamp(
          checkpoint - DEFAULT_INTERVAL_MS * (MAX_CANDLES_PER_REQUEST - 2),
          DEFAULT_INTERVAL_MS,
        );

        try {
          const rawKlines = await getFuturesKlines(
            ticker,
            DEFAULT_INTERVAL,
            startTime,
            MAX_CANDLES_PER_REQUEST,
          );
          allKlines.push(...this.formatKlines(ticker, rawKlines));
        } catch (err) {
          this.logger.warn(`syncOldKlines: failed for ${ticker} — ${err}`);
        }

        await sleep(INTER_TICKER_DELAY_MS);
      });

      await batchExecute(tasks, TICKER_CONCURRENCY);
      await this.workerKlineService.handleSaveKlines5m(allKlines);

      this.logger.log(
        `syncOldKlines: done — ${allKlines.length} klines backfilled`,
      );
    } catch (err) {
      this.logger.error(
        'syncOldKlines failed',
        err instanceof Error ? err.stack : String(err),
      );
    } finally {
      await RedisLock.releaseLock(this.redis, RedisKey.LOCK_SYNC_OLD_KLINE);
    }
  }

  // ─── Helpers: ClickHouse checkpoint queries ─────────────────────────

  /**
   * Lấy openTime mới nhất cho mỗi ticker đã có trong ClickHouse.
   * Dùng cho syncNewKlines — biết cần fetch từ thời điểm nào.
   */
  private async getNewestCheckpoints(): Promise<Record<string, number>> {
    const result = await this.clickhouse.query({
      query: `
        SELECT ticker, max(openTime) AS latestOpenTime
        FROM future_kline_5m
        GROUP BY ticker
      `,
      format: 'JSONEachRow',
    });

    const rows = await result.json() as { ticker: string; latestOpenTime: string }[];
    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.ticker] = Number(row.latestOpenTime);
    }
    return map;
  }

  /**
   * Lấy openTime cũ nhất cho mỗi ticker đã có trong ClickHouse.
   * Dùng cho syncOldKlines — biết backfill cần đi ngược đến đâu.
   */
  private async getOldestCheckpoints(): Promise<Record<string, number>> {
    const result = await this.clickhouse.query({
      query: `
        SELECT ticker, min(openTime) AS oldestOpenTime
        FROM future_kline_5m
        GROUP BY ticker
      `,
      format: 'JSONEachRow',
    });

    const rows = await result.json() as { ticker: string; oldestOpenTime: string }[];
    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.ticker] = Number(row.oldestOpenTime);
    }
    return map;
  }
}
