export interface TradingSignal {
  id: string;
  symbol: string;
  type: 'PUMP' | 'DUMP' | 'VOLATILITY_SPIKE';
  confidence: number;
  detectedAt: Date;
  metadata: Record<string, unknown>;
}
