import { MarketData } from './market-data.interface';

export interface IMarketDataRepository {
  getKlines(symbol: string, interval: string, limit: number): Promise<MarketData[]>;
}
