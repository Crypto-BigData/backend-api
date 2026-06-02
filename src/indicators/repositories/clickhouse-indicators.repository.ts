import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import type { ClickHouseClient } from '@clickhouse/client';
import { CLICKHOUSE_CLIENT } from '../../config/clickhouse.module';
import { IIndicatorsRepository, IndicatorCandle } from '../interfaces/indicators-repository.interface';

@Injectable()
export class ClickHouseIndicatorsRepository implements IIndicatorsRepository {
  private readonly logger = new Logger(ClickHouseIndicatorsRepository.name);

  constructor(
    @Inject(CLICKHOUSE_CLIENT)
    private readonly clickhouse: ClickHouseClient,
  ) {}

  async getCandles(
    ticker: string,
    fromTime: number,
    toTime: number,
    interval: number,
    lookbackCandles: number,
  ): Promise<IndicatorCandle[]> {
    if (interval % 300_000 !== 0 || interval <= 0) {
      throw new BadRequestException(
        `interval must be a positive multiple of 300000ms, got ${interval}`,
      );
    }

    const countNeeded = Math.floor(interval / 300_000);

    // Mở rộng fromTime về phía trước để lấy thêm candles cho indicator warmup.
    // Nếu adjustedFromTime nhỏ hơn data range thực tế trong ClickHouse,
    // WHERE clause tự filter — service layer xử lý graceful với ít data hơn expected.
    const adjustedFromTime = fromTime - lookbackCandles * interval;

    const query = `
      SELECT
          bucket * {interval:UInt64} AS openTime,
          argMin(open, openTime) AS open,
          max(high) AS high,
          min(low) AS low,
          argMax(close, openTime) AS close,
          sum(volume) AS volume
      FROM (
          SELECT *, intDiv(openTime, {interval:UInt64}) AS bucket
          FROM future_kline_5m FINAL
          WHERE ticker = {ticker:String}
            AND openTime >= {adjustedFromTime:UInt64}
            AND openTime <= {toTime:UInt64}
          ORDER BY openTime ASC
      )
      GROUP BY bucket
      HAVING count() = {countNeeded:UInt64}
      ORDER BY bucket ASC
    `;

    try {
      const resultSet = await this.clickhouse.query({
        query,
        query_params: {
          ticker,
          interval,
          // Guard: ClickHouse param type UInt64 không chấp nhận giá trị âm.
          // adjustedFromTime có thể âm nếu fromTime rất nhỏ (gần epoch 0),
          // dù trong thực tế crypto data bắt đầu từ ~2017 nên rất hiếm xảy ra.
          adjustedFromTime: Math.max(0, adjustedFromTime),
          toTime,
          countNeeded,
        },
        format: 'JSONEachRow',
      });

      const rawData = await resultSet.json<any>();

      return rawData.map((row: any) => ({
        openTime: Number(row.openTime),
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to fetch candles for indicators, ticker=${ticker}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
