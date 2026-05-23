import { Injectable } from '@nestjs/common';
import { IMarketDataRepository } from '../interfaces/market-data-repository.interface';
import { MarketData } from '../interfaces/market-data.interface';

@Injectable()
export class MockMarketDataRepository implements IMarketDataRepository {
  async getKlines(symbol: string, interval: string, limit: number): Promise<MarketData[]> {
    return [];
  }
}
