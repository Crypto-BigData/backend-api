export interface TradingSignal {
  id: string;
  ticker: string;
  type: 'PUMP' | 'DUMP' | 'VOLATILITY_SPIKE';
  confidence: number;
  detectedAt: Date;
  metadata: Record<string, unknown>;
}
