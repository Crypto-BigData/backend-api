import { Injectable, Inject, Logger, InternalServerErrorException } from '@nestjs/common';
import type { ClickHouseClient } from '@clickhouse/client';
import { CLICKHOUSE_CLIENT } from '../../config/clickhouse.module';
import { IOverviewRepository } from '../interfaces/overview-repository.interface';
import { MarketSummary } from '../interfaces/market-summary.interface';
import { TopMover } from '../interfaces/top-mover.interface';
import { VolumeSpike } from '../interfaces/volume-spike.interface';

@Injectable()
export class ClickHouseOverviewRepository implements IOverviewRepository {
  private readonly logger = new Logger(ClickHouseOverviewRepository.name);

  constructor(
    @Inject(CLICKHOUSE_CLIENT)
    private readonly clickhouse: ClickHouseClient,
  ) {}

  async getMarketSummary(): Promise<MarketSummary> {
    try {
      // Sử dụng argMax và argMin để so sánh "nến cuối cùng trong 24h" và "nến đầu tiên trong 24h"
      // Đây không phải là so sánh với điểm thời gian fix cứng "exactly 24h ago" mà quét toàn bộ dữ liệu 24h qua.
      // Cách này đảm bảo không bị lỗi sai số do data gap.
      const priceQuery = `
        SELECT 
            ticker, 
            argMax(close, openTime) AS price, 
            argMin(close, openTime) AS pastPrice 
        FROM future_kline_5m FINAL 
        WHERE ticker IN ('BTCUSDT', 'ETHUSDT') 
          AND openTime >= toUnixTimestamp(now() - INTERVAL 1 DAY) * 1000 
        GROUP BY ticker
      `;
      
      const sentimentQuery = `
        SELECT sentiment, count() AS count 
        FROM news FINAL 
        WHERE publishedOn >= toUnixTimestamp(now() - INTERVAL 1 DAY) 
        GROUP BY sentiment
      `;

      const [priceResult, sentimentResult] = await Promise.all([
        this.clickhouse.query({ query: priceQuery, format: 'JSONEachRow' }),
        this.clickhouse.query({ query: sentimentQuery, format: 'JSONEachRow' })
      ]);

      const prices = await priceResult.json<any>();
      const sentiments = await sentimentResult.json<any>();

      const summary: MarketSummary = {
        btcPrice: '0', btcChange24h: '0',
        ethPrice: '0', ethChange24h: '0',
        generalSentiment: { positive: 0, neutral: 0, negative: 0 }
      };

      for (const row of prices) {
        const change = ((Number(row.price) - Number(row.pastPrice)) / Number(row.pastPrice)) * 100;
        if (row.ticker === 'BTCUSDT') {
          summary.btcPrice = row.price;
          summary.btcChange24h = change.toFixed(2);
        } else if (row.ticker === 'ETHUSDT') {
          summary.ethPrice = row.price;
          summary.ethChange24h = change.toFixed(2);
        }
      }

      for (const row of sentiments) {
        if (row.sentiment === 'positive') summary.generalSentiment.positive = Number(row.count);
        if (row.sentiment === 'neutral') summary.generalSentiment.neutral = Number(row.count);
        if (row.sentiment === 'negative') summary.generalSentiment.negative = Number(row.count);
      }

      if (summary.btcPrice === '0' || summary.ethPrice === '0') {
        throw new InternalServerErrorException('Missing BTC or ETH market data in the last 24h');
      }

      return summary;
    } catch (error) {
      this.logger.error('Failed to get market summary', error instanceof Error ? error.stack : error);
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get market summary data');
    }
  }

  async getTopMovers(): Promise<TopMover[]> {
    try {
      // Tương tự getMarketSummary, argMin và argMax ở đây so sánh nến đầu và nến cuối 
      // trong khoảng 24h để tính price change, không so với điểm thời gian fix cứng.
      const query = `
        SELECT 
            ticker, 
            argMax(close, openTime) AS lastPrice, 
            argMin(close, openTime) AS pastPrice, 
            ((argMax(close, openTime) - argMin(close, openTime)) / argMin(close, openTime)) * 100 AS priceChangePercent24h 
        FROM future_kline_5m FINAL 
        WHERE openTime >= toUnixTimestamp(now() - INTERVAL 1 DAY) * 1000 
        GROUP BY ticker 
        ORDER BY priceChangePercent24h DESC
      `;

      const resultSet = await this.clickhouse.query({ query, format: 'JSONEachRow' });
      const rows = await resultSet.json<any>();

      const gainers: TopMover[] = rows.slice(0, 5).map((r: any) => ({
        ticker: r.ticker,
        lastPrice: r.lastPrice,
        priceChangePercent24h: Number(r.priceChangePercent24h).toFixed(2),
        type: 'gainer' as const
      }));

      // Slice lấy 5 token cuối cùng (những token giảm nhiều nhất do đang ORDER BY DESC)
      // Không dùng reverse() theo feedback, thay vào đó sort ASC để đảm bảo token giảm mạnh nhất đứng đầu danh sách losers.
      const losers: TopMover[] = rows.slice(-5)
        .map((r: any) => ({
          ticker: r.ticker,
          lastPrice: r.lastPrice,
          priceChangePercent24h: Number(r.priceChangePercent24h).toFixed(2),
          type: 'loser' as const
        }))
        .sort((a, b) => Number(a.priceChangePercent24h) - Number(b.priceChangePercent24h));

      return [...gainers, ...losers];
    } catch (error) {
      this.logger.error('Failed to get top movers', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  async getVolumeSpikes(threshold: number, limit: number): Promise<VolumeSpike[]> {
    try {
      // Dùng sumIf để tổng hợp dữ liệu 24h và 7d trong 1 pass thay vì CTE
      const query = `
        SELECT 
            ticker, 
            sumIf(volume, openTime >= toUnixTimestamp(now() - INTERVAL 1 DAY) * 1000) AS lastVolume24h, 
            sumIf(volume, openTime >= toUnixTimestamp(now() - INTERVAL 7 DAY) * 1000 AND openTime < toUnixTimestamp(now() - INTERVAL 1 DAY) * 1000) / 7 AS averageVolume7d 
        FROM future_kline_5m FINAL 
        WHERE openTime >= toUnixTimestamp(now() - INTERVAL 7 DAY) * 1000 
        GROUP BY ticker 
        HAVING averageVolume7d > 0 AND (lastVolume24h / averageVolume7d) > {threshold:Float64} 
        ORDER BY (lastVolume24h / averageVolume7d) DESC 
        LIMIT {limit:UInt32}
      `;

      const resultSet = await this.clickhouse.query({
        query,
        query_params: { threshold, limit },
        format: 'JSONEachRow'
      });

      const rows = await resultSet.json<any>();
      return rows.map((r: any) => ({
        ticker: r.ticker,
        lastVolume24h: Number(r.lastVolume24h).toFixed(2),
        averageVolume7d: Number(r.averageVolume7d).toFixed(2),
        spikeRatio: (Number(r.lastVolume24h) / Number(r.averageVolume7d)).toFixed(2)
      }));
    } catch (error) {
      this.logger.error('Failed to get volume spikes', error instanceof Error ? error.stack : error);
      throw error;
    }
  }
}
