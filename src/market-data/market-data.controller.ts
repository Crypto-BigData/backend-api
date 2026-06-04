import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { MarketDataService } from './market-data.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KlineQueryDto } from './dto/kline-query.dto';
import { KlineDto } from './dto/kline-response.dto';

@ApiTags('Market Data')
@Controller('kline')
@UseInterceptors(CacheInterceptor)
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('klines')
  @ApiOperation({ summary: 'Get candlestick data (OHLCV) dynamically aggregated' })
  @ApiResponse({ status: 200, description: 'Return array of Kline data', type: [KlineDto] })
  @CacheTTL(60000) // Cache 60s
  async getKlines(@Query() query: KlineQueryDto) {
    // Defaults: nếu không truyền fromTime/toTime → lấy 24h gần nhất
    const now = Date.now();
    const from = query.fromTime ? Number(query.fromTime) : now - 24 * 60 * 60 * 1000;
    const to = query.toTime ? Number(query.toTime) : now;
    const intervalMs = Number(query.interval ?? '300000');

    return this.marketDataService.getKlines(query.ticker?.toUpperCase() ?? 'BTCUSDT', from, to, intervalMs);
  }

  @Get('time-now')
  @ApiOperation({ summary: 'Get current server time in epoch milliseconds' })
  getTimeNow() {
    return { timestamp: Date.now() };
  }
}
