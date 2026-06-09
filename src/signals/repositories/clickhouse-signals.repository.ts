import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ClickHouseClient } from '@clickhouse/client';
import { CLICKHOUSE_CLIENT } from '../../config/clickhouse.module';
import { ISignalsRepository } from '../interfaces/signals-repository.interface';
import { TradingSignal } from '../interfaces/trading-signal.interface';

@Injectable()
export class ClickHouseSignalsRepository implements ISignalsRepository {
  private readonly logger = new Logger(ClickHouseSignalsRepository.name);

  constructor(
    @Inject(CLICKHOUSE_CLIENT)
    private readonly clickhouse: ClickHouseClient,
  ) {}

  async getActiveSignals(limit: number, ticker?: string): Promise<TradingSignal[]> {
    try {
      const query = `
        SELECT 
            id,
            ticker,
            type,
            price,
            reason,
            timestamp
        FROM signals
        ${ticker ? 'WHERE ticker = {ticker: String}' : ''}
        ORDER BY timestamp DESC
        LIMIT {limit: UInt32}
      `;

      const resultSet = await this.clickhouse.query({
        query,
        query_params: { limit, ticker },
        format: 'JSONEachRow',
      });

      const rows = await resultSet.json<{
        id: string;
        ticker: string;
        type: string;
        price: number;
        reason: string;
        timestamp: string; // ClickHouse UInt64 comes as string in JSONEachRow
      }>();

      return rows.map((row) => {
        return {
          id: row.id,
          ticker: row.ticker,
          type: (row.type.toUpperCase() === 'PUMP' ? 'PUMP' : row.type.toUpperCase() === 'DUMP' ? 'DUMP' : 'VOLATILITY_SPIKE') as any,
          confidence: 0.95, // Hardcoded for rule-based signals
          detectedAt: new Date(Number(row.timestamp)),
          metadata: {
            price: row.price,
            reason: row.reason,
          },
        };
      });
    } catch (error) {
      this.logger.error(`Failed to fetch signals: ${error.message}`);
      return []; // Return empty instead of crashing
    }
  }
}
