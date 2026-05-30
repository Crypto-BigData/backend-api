import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import type { ClickHouseClient } from '@clickhouse/client';
import { IMarketDataRepository } from '../interfaces/market-data-repository.interface';
import { MarketData } from '../interfaces/market-data.interface';
import { CLICKHOUSE_CLIENT } from '../../config/clickhouse.module';

@Injectable()
export class ClickHouseMarketDataRepository implements IMarketDataRepository {
  private readonly logger = new Logger(ClickHouseMarketDataRepository.name);

  constructor(
    @Inject(CLICKHOUSE_CLIENT)
    private readonly clickhouse: ClickHouseClient,
  ) {}

  async getKlines(
    ticker: string,
    fromTime: number,
    toTime: number,
    interval: number,
  ): Promise<MarketData[]> {
    if (interval % 300_000 !== 0 || interval <= 0) {
      throw new BadRequestException(
        `interval must be a positive multiple of 300000ms, got ${interval}`,
      );
    }
    
    const countNeeded = Math.floor(interval / 300000);

    const query = `
      SELECT
          ticker,
          bucket * {interval:UInt64} AS openTime,
          argMin(open, openTime) AS open,
          max(high) AS high,
          min(low) AS low,
          argMax(close, openTime) AS close,
          sum(volume) AS volume,
          max(closeTime) AS closeTime,
          sum(quoteAssetVolume) AS quoteAssetVolume,
          sum(numOfTrades) AS numOfTrades,
          sum(takerBuyBaseAssetVolume) AS takerBuyBaseAssetVolume,
          sum(takerBuyQuoteAssetVolume) AS takerBuyQuoteAssetVolume
      FROM (
          SELECT *, intDiv(openTime, {interval:UInt64}) AS bucket
          FROM future_kline_5m FINAL
          WHERE ticker = {ticker:String}
            AND openTime >= {fromTime:UInt64}
            AND openTime <= {toTime:UInt64}
          ORDER BY openTime ASC
      )
      GROUP BY ticker, bucket
      HAVING count() = {countNeeded:UInt64}
      ORDER BY bucket ASC
    `;

    try {
      const resultSet = await this.clickhouse.query({
        query,
        query_params: {
          ticker,
          interval,
          fromTime,
          toTime,
          countNeeded,
        },
        format: 'JSONEachRow',
      });

      const rawData = await resultSet.json<any>();
      
      return rawData.map((row: any) => ({
        ...row,
        openTime: Number(row.openTime),
        closeTime: Number(row.closeTime),
        numOfTrades: Number(row.numOfTrades),
      })) as MarketData[];
    } catch (error) {
      this.logger.error(
        `Failed to fetch klines from ClickHouse for ticker ${ticker}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
