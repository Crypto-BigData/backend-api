import { Controller, Get, Query } from '@nestjs/common';
import { SignalsService } from './signals.service';

@Controller('signals')
export class SignalsController {
  constructor(private readonly signalsService: SignalsService) {}

  @Get('active')
  async getActiveSignals(@Query('limit') limit: number = 10) {
    return this.signalsService.getActiveSignals(Number(limit));
  }
}
