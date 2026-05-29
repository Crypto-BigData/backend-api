import { MarketData } from './market-data.interface';

/**
 * interval = bội số của 300000ms (5 phút). fromTime/toTime = epoch ms.
 */
export interface IMarketDataRepository {
  getKlines(
    ticker: string,
    fromTime: number,
    toTime: number,
    interval: number,
  ): Promise<MarketData[]>;
}
