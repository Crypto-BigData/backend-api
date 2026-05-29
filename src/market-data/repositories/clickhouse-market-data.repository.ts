import { Injectable, NotImplementedException } from '@nestjs/common';
import { IMarketDataRepository } from '../interfaces/market-data-repository.interface';
import { MarketData } from '../interfaces/market-data.interface';

@Injectable()
export class ClickHouseMarketDataRepository implements IMarketDataRepository {
  async getKlines(
    ticker: string,
    fromTime: number,
    toTime: number,
    interval: number,
  ): Promise<MarketData[]> {
    throw new NotImplementedException(
      'ClickHouse kline repository — sẽ được implement ở Task 1.3.',
    );
  }
}
