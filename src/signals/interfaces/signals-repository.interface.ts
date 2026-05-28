import { TradingSignal } from './trading-signal.interface';

export interface ISignalsRepository {
  getActiveSignals(limit: number): Promise<TradingSignal[]>;
}
