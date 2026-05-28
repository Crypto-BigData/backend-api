import { Injectable, Inject } from '@nestjs/common';
import { MARKET_DATA_REPOSITORY } from './constants';
import type { IMarketDataRepository } from './interfaces/market-data-repository.interface';
import { MarketData } from './interfaces/market-data.interface';

@Injectable()
export class MarketDataService {
  constructor(
    @Inject(MARKET_DATA_REPOSITORY)
    private readonly repository: IMarketDataRepository,
  ) {}

  async getKlines(symbol: string, interval: string, limit: number = 100): Promise<MarketData[]> {
    return this.repository.getKlines(symbol, interval, limit);
  }
}
