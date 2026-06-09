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
  ): Promise<IndicatorCandle[]> {
    if (interval % 300_000 !== 0 || interval <= 0) {
      throw new BadRequestException(
        `interval must be a positive multiple of 300000ms, got ${interval}`,
      );
    }

    const countNeeded = Math.floor(interval / 300_000);
    const includeIndicators = interval === 300_000;

    let query: string;

    if (includeIndicators) {
      query = `
        SELECT
            a.openTime AS openTime,
            a.open AS open,
            a.high AS high,
            a.low AS low,
            a.close AS close,
            a.volume AS volume,
            b.ma20 AS ma20,
            b.ma50 AS ma50,
            b.rsi AS rsi,
            b.bb_upper AS bb_upper,
            b.bb_lower AS bb_lower
        FROM future_kline_5m FINAL a
        LEFT JOIN kline_indicators FINAL b ON a.ticker = b.ticker AND a.openTime = b.openTime
        WHERE a.ticker = {ticker:String}
          AND a.openTime >= {fromTime:UInt64}
          AND a.openTime <= {toTime:UInt64}
        ORDER BY a.openTime ASC
      `;
    } else {
      query = `
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
              AND openTime >= {fromTime:UInt64}
              AND openTime <= {toTime:UInt64}
            ORDER BY openTime ASC
        )
        GROUP BY bucket
        HAVING count() = {countNeeded:UInt64}
        ORDER BY bucket ASC
      `;
    }

    try {
      const resultSet = await this.clickhouse.query({
        query,
        query_params: {
          ticker,
          interval,
          fromTime: Math.max(0, fromTime),
          toTime,
          countNeeded,
        },
        format: 'JSONEachRow',
      });

      const rawData = await resultSet.json<any>();

      return rawData.map((row: any) => {
        const candle: IndicatorCandle = {
          openTime: Number(row.openTime),
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          volume: row.volume,
        };
        
        if (includeIndicators) {
          if (row.ma20) candle.ma20 = String(row.ma20);
          if (row.ma50) candle.ma50 = String(row.ma50);
          if (row.rsi) candle.rsi = String(row.rsi);
          if (row.bb_upper) candle.bb_upper = String(row.bb_upper);
          if (row.bb_lower) candle.bb_lower = String(row.bb_lower);
        }

        return candle;
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch candles for indicators, ticker=${ticker}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
