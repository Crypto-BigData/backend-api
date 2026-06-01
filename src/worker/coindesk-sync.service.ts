import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import type { ClickHouseClient } from '@clickhouse/client';
import type Redis from 'ioredis';

import { CLICKHOUSE_CLIENT } from '../config/clickhouse.module';
import { REDIS_CLIENT } from '../config/redis.module';
import { WorkerNewsService } from './worker-news.service';
import { RedisLock } from '../common/utils/redis-lock';
import { RedisKey } from '../common/utils/constants';
import { CoinDeskAdapter } from '../common/utils/coindesk.adapter';

/** Lock TTL */
const SYNC_LATEST_LOCK_TTL = 50;  // 50s < 60s cycle
const SYNC_OLD_LOCK_TTL = 290;    // 290s < 300s (5m) cycle

const MAX_NEWS_PER_REQUEST = 100;

@Injectable()
export class CoindeskSyncService implements OnModuleInit {
  private readonly logger = new Logger(CoindeskSyncService.name);
  private backfillCutoffSecs: number;
  private coindeskAdapter: CoinDeskAdapter;
  private hasKeys = false;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(CLICKHOUSE_CLIENT) private readonly clickhouse: ClickHouseClient,
    private readonly workerNewsService: WorkerNewsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const months = this.configService.get<number>('BACKFILL_MONTHS', 6);
    this.backfillCutoffSecs = Math.floor(Date.now() / 1000) - months * 30 * 24 * 60 * 60;

    const apiKeysConfig = this.configService.get<string>('COINDESK_API_KEYS', '');
    this.coindeskAdapter = new CoinDeskAdapter(apiKeysConfig);
    this.hasKeys = this.coindeskAdapter.hasKeys();

    if (!this.hasKeys) {
      this.logger.warn('No COINDESK_API_KEYS configured — CoinDesk sync is disabled.');
    }

    // Release stale locks on startup
    await RedisLock.releaseLock(this.redis, RedisKey.LOCK_SYNC_LATEST_NEWS);
    await RedisLock.releaseLock(this.redis, RedisKey.LOCK_SYNC_OLD_NEWS);
  }

  // ─── CronJob 1: Sync tin tức MỚI (mỗi phút) ───────────────────────
  @Cron('* * * * *')
  async syncLatestNews(): Promise<void> {
    if (!this.hasKeys) return;

    const locked = await RedisLock.setLock(
      this.redis,
      RedisKey.LOCK_SYNC_LATEST_NEWS,
      SYNC_LATEST_LOCK_TTL,
    ).catch(() => false);

    if (!locked) return;

    try {
      this.logger.log('syncLatestNews: start');

      // Fetch tin tức mới nhất tính đến thời điểm hiện tại
      const toTime = Math.floor(Date.now() / 1000);
      const news = await this.coindeskAdapter.fetchNews(toTime, MAX_NEWS_PER_REQUEST);

      await this.workerNewsService.handleSaveNews(news);

      this.logger.log(`syncLatestNews: done — fetched ${news.length} items`);
    } catch (err) {
      this.logger.error(
        'syncLatestNews failed',
        err instanceof Error ? err.stack : String(err),
      );
    } finally {
      await RedisLock.releaseLock(this.redis, RedisKey.LOCK_SYNC_LATEST_NEWS);
    }
  }

  // ─── CronJob 2: Backfill tin tức CŨ (mỗi 5 phút) ──────────────────
  @Cron('*/5 * * * *')
  async syncOldNews(): Promise<void> {
    if (!this.hasKeys) return;

    const locked = await RedisLock.setLock(
      this.redis,
      RedisKey.LOCK_SYNC_OLD_NEWS,
      SYNC_OLD_LOCK_TTL,
    ).catch(() => false);

    if (!locked) return;

    try {
      this.logger.log('syncOldNews: start');

      const oldestPublishedOn = await this.getOldestCheckpoint();
      
      // Nếu db trống, fallback về thời điểm hiện tại
      const checkpoint = oldestPublishedOn || Math.floor(Date.now() / 1000);

      if (checkpoint <= this.backfillCutoffSecs) {
        this.logger.log('syncOldNews: reached backfill cutoff, stopping.');
        return;
      }

      // Fetch các tin cũ hơn oldest news đã lưu
      const toTime = checkpoint - 1;
      const news = await this.coindeskAdapter.fetchNews(toTime, MAX_NEWS_PER_REQUEST);

      await this.workerNewsService.handleSaveNews(news);

      this.logger.log(`syncOldNews: done — fetched ${news.length} items`);
    } catch (err) {
      this.logger.error(
        'syncOldNews failed',
        err instanceof Error ? err.stack : String(err),
      );
    } finally {
      await RedisLock.releaseLock(this.redis, RedisKey.LOCK_SYNC_OLD_NEWS);
    }
  }

  // ─── Helper: ClickHouse checkpoint query ──────────────────────────

  /**
   * Lấy publishedOn cũ nhất đã có trong ClickHouse để backfill tiếp.
   */
  private async getOldestCheckpoint(): Promise<number | null> {
    const result = await this.clickhouse.query({
      query: `
        SELECT min(publishedOn) AS oldestPublishedOn
        FROM news
      `,
      format: 'JSONEachRow',
    });

    const rows = await result.json() as { oldestPublishedOn: string }[];
    if (rows && rows.length > 0 && rows[0].oldestPublishedOn) {
      return Number(rows[0].oldestPublishedOn);
    }
    return null;
  }
}
