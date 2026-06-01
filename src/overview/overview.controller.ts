import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { OverviewService } from './overview.service';
import { MarketSummary } from './interfaces/market-summary.interface';
import { TopMover } from './interfaces/top-mover.interface';
import { VolumeSpike } from './interfaces/volume-spike.interface';

@Controller('overview')
@UseInterceptors(CacheInterceptor)
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get('market-summary')
  @CacheTTL(15000) // 15 seconds cho btc/eth price
  async getMarketSummary(): Promise<MarketSummary> {
    return this.overviewService.getMarketSummary();
  }

  @Get('top-movers')
  @CacheTTL(60000) // 60 seconds
  async getTopMovers(): Promise<TopMover[]> {
    return this.overviewService.getTopMovers();
  }

  @Get('volume-spike')
  @CacheTTL(60000) // 60 seconds
  async getVolumeSpikes(
    @Query('threshold') thresholdStr?: string,
    @Query('limit') limitStr?: string,
  ): Promise<VolumeSpike[]> {
    const threshold = thresholdStr ? parseFloat(thresholdStr) : 2.0;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    
    return this.overviewService.getVolumeSpikes(
      isNaN(threshold) ? 2.0 : threshold,
      isNaN(limit) ? 10 : limit,
    );
  }
}
