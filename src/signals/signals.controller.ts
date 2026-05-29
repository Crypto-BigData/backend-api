import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { SignalsService } from './signals.service';

@Controller('signals')
@UseInterceptors(CacheInterceptor)
export class SignalsController {
  constructor(private readonly signalsService: SignalsService) {}

  @Get('active')
  @CacheTTL(10000) // Cache 10s
  async getActiveSignals(@Query('limit') limit: number = 10) {
    return this.signalsService.getActiveSignals(Number(limit));
  }
}
