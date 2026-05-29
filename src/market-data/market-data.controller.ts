import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { MarketDataService } from './market-data.service';

@Controller('kline')
@UseInterceptors(CacheInterceptor)
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('klines')
  @CacheTTL(60000) // Cache 60s
  async getKlines(
    @Query('ticker') ticker: string = 'BTCUSDT',
    @Query('fromTime') fromTime?: string,
    @Query('toTime') toTime?: string,
    @Query('interval') interval: string = '300000',
  ) {
    // Defaults: nếu không truyền fromTime/toTime → lấy 24h gần nhất
    const now = Date.now();
    const from = fromTime ? Number(fromTime) : now - 24 * 60 * 60 * 1000;
    const to = toTime ? Number(toTime) : now;
    const intervalMs = Number(interval);

    return this.marketDataService.getKlines(ticker.toUpperCase(), from, to, intervalMs);
  }

  @Get('time-now')
  getTimeNow() {
    return { timestamp: Date.now() };
  }
}
