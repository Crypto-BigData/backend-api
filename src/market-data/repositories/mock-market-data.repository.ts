import { Injectable, Logger } from '@nestjs/common';
import { IMarketDataRepository } from '../interfaces/market-data-repository.interface';
import { MarketData } from '../interfaces/market-data.interface';

/**
 * Mock implementation gọi Binance public API.
 *
 * Map dữ liệu Binance klines (array format) sang MarketData domain model.
 * Dùng khi USE_MOCK=true — interval được convert từ ms sang Binance string.
 */
@Injectable()
export class MockMarketDataRepository implements IMarketDataRepository {
  private readonly logger = new Logger(MockMarketDataRepository.name);

  /**
   * Map interval (ms) → Binance interval string.
   * Chỉ hỗ trợ các interval chuẩn, mặc định 5m.
   */
  private intervalMsToString(intervalMs: number): string {
    const map: Record<number, string> = {
      300_000: '5m',
      900_000: '15m',
      3_600_000: '1h',
      14_400_000: '4h',
      86_400_000: '1d',
    };
    return map[intervalMs] ?? '5m';
  }

  async getKlines(
    ticker: string,
    fromTime: number,
    toTime: number,
    interval: number,
  ): Promise<MarketData[]> {
    try {
      const binanceInterval = this.intervalMsToString(interval);

      // Binance API nhận startTime/endTime dạng ms
      const url = new URL('https://api.binance.com/api/v3/klines');
      url.searchParams.set('symbol', ticker.toUpperCase());
      url.searchParams.set('interval', binanceInterval);
      url.searchParams.set('startTime', String(fromTime));
      url.searchParams.set('endTime', String(toTime));
      url.searchParams.set('limit', '1000');

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.statusText}`);
      }

      const data: any[][] = await response.json();

      // Mapper: Binance API trả về array theo thứ tự cố định
      // [0] openTime, [1] open, [2] high, [3] low, [4] close,
      // [5] volume, [6] closeTime, [7] quoteAssetVolume,
      // [8] numOfTrades, [9] takerBuyBaseAssetVolume,
      // [10] takerBuyQuoteAssetVolume, [11] ignore
      return data.map((kline) => ({
        ticker: ticker.toUpperCase(),
        openTime: kline[0] as number,
        open: kline[1] as string,
        high: kline[2] as string,
        low: kline[3] as string,
        close: kline[4] as string,
        volume: kline[5] as string,
        closeTime: kline[6] as number,
        quoteAssetVolume: kline[7] as string,
        numOfTrades: kline[8] as number,
        takerBuyBaseAssetVolume: kline[9] as string,
        takerBuyQuoteAssetVolume: kline[10] as string,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to fetch mock market data for ${ticker}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
