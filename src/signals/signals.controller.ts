import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { SignalsService } from './signals.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignalQueryDto } from './dto/signal-query.dto';
import { SignalDto } from './dto/signal-response.dto';

@ApiTags('Signals')
@Controller('signals')
@UseInterceptors(CacheInterceptor)
export class SignalsController {
  constructor(private readonly signalsService: SignalsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get active trading signals' })
  @ApiResponse({ status: 200, description: 'List of active trading signals', type: [SignalDto] })
  @CacheTTL(10000) // Cache 10s
  async getActiveSignals(@Query() query: SignalQueryDto) {
    return this.signalsService.getActiveSignals(Number(query.limit ?? '10'));
  }
}
