import { Injectable } from '@nestjs/common';
import { ISignalsRepository } from '../interfaces/signals-repository.interface';
import { TradingSignal } from '../interfaces/trading-signal.interface';

@Injectable()
export class MockSignalsRepository implements ISignalsRepository {
  async getActiveSignals(limit: number): Promise<TradingSignal[]> {
    const mockData: TradingSignal[] = [
      {
        id: 'sig-1',
        symbol: 'BTCUSDT',
        type: 'PUMP',
        confidence: 0.85,
        detectedAt: new Date(Date.now() - 1000 * 60 * 2), // 2 mins ago
        metadata: {
          triggerPrice: '65400.00',
          volumeRatio: 3.5,
          source: 'Spark Streaming',
        },
      },
      {
        id: 'sig-2',
        symbol: 'ETHUSDT',
        type: 'VOLATILITY_SPIKE',
        confidence: 0.72,
        detectedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
        metadata: {
          triggerPrice: '3450.00',
          historicalVolatility: 0.05,
          currentVolatility: 0.15,
        },
      },
      {
        id: 'sig-3',
        symbol: 'SOLUSDT',
        type: 'DUMP',
        confidence: 0.91,
        detectedAt: new Date(Date.now() - 1000 * 60 * 10), // 10 mins ago
        metadata: {
          triggerPrice: '142.50',
          sellPressureIndex: 8.2,
          newsSentimentImpact: -0.6,
        },
      },
    ];

    return mockData.slice(0, limit);
  }
}
