import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { OverviewService } from './overview.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VolumeSpikeQueryDto } from './dto/volume-spike-query.dto';
import { MarketSummaryDto, TopMoverDto, VolumeSpikeDto } from './dto/overview-response.dto';

@ApiTags('Overview Dashboard')
@Controller('overview')
@UseInterceptors(CacheInterceptor)
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get('market-summary')
  @ApiOperation({ summary: 'Get high-level market summary (BTC/ETH prices and sentiment)' })
  @ApiResponse({ status: 200, description: 'Market summary object', type: MarketSummaryDto })
  @CacheTTL(15000) // 15 seconds cho btc/eth price
  async getMarketSummary() {
    return this.overviewService.getMarketSummary();
  }

  @Get('top-movers')
  @ApiOperation({ summary: 'Get top 5 gainers and top 5 losers in the last 24h' })
  @ApiResponse({ status: 200, description: 'Array of top movers', type: [TopMoverDto] })
  @CacheTTL(60000) // 60 seconds
  async getTopMovers() {
    return this.overviewService.getTopMovers();
  }

  @Get('volume-spike')
  @ApiOperation({ summary: 'Detect coins with recent volume spikes vs 7-day average' })
  @ApiResponse({ status: 200, description: 'Array of volume spikes', type: [VolumeSpikeDto] })
  @CacheTTL(60000) // 60 seconds
  async getVolumeSpikes(@Query() query: VolumeSpikeQueryDto) {
    return this.overviewService.getVolumeSpikes(
      Number(query.threshold ?? '2.0'),
      Number(query.limit ?? '10')
    );
  }
}
