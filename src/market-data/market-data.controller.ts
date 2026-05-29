import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { MarketDataService } from './market-data.service';

@Controller('market-data')
@UseInterceptors(CacheInterceptor)
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get(':symbol/klines')
  @CacheTTL(60000) // Cache 60s
  async getKlines(
    @Param('symbol') symbol: string,
    @Query('interval') interval: string = '1h',
    @Query('limit') limit: number = 100,
  ) {
    return this.marketDataService.getKlines(symbol.toUpperCase(), interval, Number(limit));
  }
}
