import { Injectable, Logger } from '@nestjs/common';
import { IMarketDataRepository } from '../interfaces/market-data-repository.interface';
import { MarketData } from '../interfaces/market-data.interface';

@Injectable()
export class MockMarketDataRepository implements IMarketDataRepository {
  private readonly logger = new Logger(MockMarketDataRepository.name);

  async getKlines(symbol: string, interval: string, limit: number): Promise<MarketData[]> {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.statusText}`);
      }

      const data: any[][] = await response.json();

      // Mapper: Binance API trả về array không tên, ta cần map index tương ứng
      return data.map((kline) => ({
        symbol: symbol.toUpperCase(),
        timestamp: kline[0] as number,
        open: kline[1] as string,
        high: kline[2] as string,
        low: kline[3] as string,
        close: kline[4] as string,
        volume: kline[5] as string,
        quoteVolume: kline[7] as string,
        tradesCount: kline[8] as number,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch mock market data for ${symbol}`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }
}
