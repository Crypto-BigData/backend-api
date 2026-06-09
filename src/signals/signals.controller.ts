import { Controller, Get, Query } from '@nestjs/common';
import { SignalsService } from './signals.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignalQueryDto } from './dto/signal-query.dto';
import { SignalDto } from './dto/signal-response.dto';

@ApiTags('Signals')
@Controller('signals')
export class SignalsController {
  constructor(private readonly signalsService: SignalsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get active trading signals' })
  @ApiResponse({ status: 200, description: 'List of active trading signals', type: [SignalDto] })
  async getActiveSignals(@Query() query: SignalQueryDto) {
    return this.signalsService.getActiveSignals(Number(query.limit ?? '10'), query.ticker);
  }
}
