import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ClickHouseClient } from '@clickhouse/client';
import { CLICKHOUSE_CLIENT } from '../config/clickhouse.module';

/**
 * Kline raw format — mapping trực tiếp từ Binance API array vào object
 * để insert ClickHouse dạng JSONEachRow.
 */
export interface KlineRow {
  ticker: string;
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

@Injectable()
export class WorkerKlineService {
  private readonly logger = new Logger(WorkerKlineService.name);

  constructor(
    @Inject(CLICKHOUSE_CLIENT)
    private readonly clickhouse: ClickHouseClient,
  ) {}

  /**
   * Batch insert klines vào bảng future_kline_5m.
   * Chia thành batch 10,000 rows để tránh quá tải memory.
   * KHÔNG gọi OPTIMIZE TABLE — ReplacingMergeTree tự dedup qua background merge.
   */
  async handleSaveKlines5m(klines: KlineRow[]): Promise<void> {
    if (klines.length === 0) return;

    const BATCH_SIZE = 10_000;

    for (let i = 0; i < klines.length; i += BATCH_SIZE) {
      const batch = klines.slice(i, i + BATCH_SIZE);

      await this.clickhouse.insert({
        table: 'future_kline_5m',
        values: batch,
        format: 'JSONEachRow',
      });
    }

    this.logger.log(`Inserted ${klines.length} klines into future_kline_5m`);
  }
}
