import { Injectable, Inject } from '@nestjs/common';
import { SIGNALS_REPOSITORY } from './constants';
import type { ISignalsRepository } from './interfaces/signals-repository.interface';
import { TradingSignal } from './interfaces/trading-signal.interface';

@Injectable()
export class SignalsService {
  constructor(
    @Inject(SIGNALS_REPOSITORY)
    private readonly repository: ISignalsRepository,
  ) {}

  async getActiveSignals(limit: number, ticker?: string) {
    return this.repository.getActiveSignals(limit, ticker);
  }
}
