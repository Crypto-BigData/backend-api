import { Injectable, NotImplementedException } from '@nestjs/common';
import { IMarketDataRepository } from '../interfaces/market-data-repository.interface';
import { MarketData } from '../interfaces/market-data.interface';

@Injectable()
export class ClickHouseMarketDataRepository implements IMarketDataRepository {
  async getKlines(symbol: string, interval: string, limit: number): Promise<MarketData[]> {
    throw new NotImplementedException('ClickHouse schema is not available yet.');
  }
}
