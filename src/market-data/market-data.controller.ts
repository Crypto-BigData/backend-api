import { Controller, Get, Param, Query } from '@nestjs/common';
import { MarketDataService } from './market-data.service';

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get(':symbol/klines')
  async getKlines(
    @Param('symbol') symbol: string,
    @Query('interval') interval: string = '1h',
    @Query('limit') limit: number = 100,
  ) {
    return this.marketDataService.getKlines(symbol.toUpperCase(), interval, Number(limit));
  }
}
