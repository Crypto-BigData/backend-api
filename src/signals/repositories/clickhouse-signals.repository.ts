import { Injectable, NotImplementedException } from '@nestjs/common';
import { ISignalsRepository } from '../interfaces/signals-repository.interface';
import { TradingSignal } from '../interfaces/trading-signal.interface';

@Injectable()
export class ClickHouseSignalsRepository implements ISignalsRepository {
  async getActiveSignals(limit: number): Promise<TradingSignal[]> {
    throw new NotImplementedException('ClickHouse schema for signals is not available yet.');
  }
}
