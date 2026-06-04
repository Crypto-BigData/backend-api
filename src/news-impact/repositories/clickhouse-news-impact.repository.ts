import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ClickHouseClient } from '@clickhouse/client';
import { CLICKHOUSE_CLIENT } from '../../config/clickhouse.module';
import { INewsImpactRepository } from '../interfaces/news-impact-repository.interface';
import {
  NewsMarker,
  PriceImpact,
  PriceImpactWindow,
  ImpactTableRow,
  SentimentCorrelation,
} from '../interfaces/news-impact-result.interface';

/** 5-minute candle duration in milliseconds */
const CANDLE_MS = 300_000;

/** Hard cap for sentiment correlation to control IN clause size */
const SENTIMENT_NEWS_CAP = 100;

@Injectable()
export class ClickHouseNewsImpactRepository implements INewsImpactRepository {
  private readonly logger = new Logger(ClickHouseNewsImpactRepository.name);

  constructor(
    @Inject(CLICKHOUSE_CLIENT)
    private readonly clickhouse: ClickHouseClient,
  ) {}

  /** Convert epoch ms → epoch seconds for news table queries */
  private toSecond(ms: number): number {
    return Math.floor(ms / 1000);
  }

  /** Calculate the 5m bucket openTime containing a given epoch ms timestamp */
  private toBucket(epochMs: number): number {
    return Math.floor(epochMs / CANDLE_MS) * CANDLE_MS;
  }

  /**
   * Batch lookup close prices for a set of (ticker, openTime) pairs.
   * Uses direct numeric interpolation for IN clause instead of named params
   * to avoid ClickHouse HTTP API overhead with hundreds of params.
   * openTimes are UInt64 numbers — no SQL injection risk.
   */
  private async batchLookupPrices(
    ticker: string,
    openTimes: number[],
  ): Promise<Map<number, string>> {
    const priceMap = new Map<number, string>();
    if (openTimes.length === 0) return priceMap;

    const unique = [...new Set(openTimes)];
    const inClause = unique.join(', ');

    const query = `
      SELECT openTime, close
      FROM future_kline_5m FINAL
      WHERE ticker = {ticker:String}
        AND openTime IN (${inClause})
    `;

    try {
      const resultSet = await this.clickhouse.query({
        query,
        query_params: { ticker },
        format: 'JSONEachRow',
      });
      const rows = await resultSet.json<any>();

      for (const row of rows) {
        priceMap.set(Number(row.openTime), row.close);
      }
    } catch (error) {
      this.logger.error(
        `Failed to batch lookup prices: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }

    return priceMap;
  }

  async getNewsMarkers(
    ticker: string,
    fromTime: number,
    toTime: number,
    limit: number,
  ): Promise<NewsMarker[]> {
    const fromTimeSec = this.toSecond(fromTime);
    const toTimeSec = this.toSecond(toTime);

    try {
      // Phase 1: Fetch news in range
      const newsQuery = `
        SELECT id, title, sourceName, sentiment, keywords, publishedOn
        FROM news FINAL
        WHERE publishedOn >= {fromTime:UInt64}
          AND publishedOn <= {toTime:UInt64}
        ORDER BY publishedOn DESC
        LIMIT {limit:UInt32}
      `;

      const newsResult = await this.clickhouse.query({
        query: newsQuery,
        query_params: { fromTime: fromTimeSec, toTime: toTimeSec, limit },
        format: 'JSONEachRow',
      });
      const newsRows = await newsResult.json<any>();

      if (newsRows.length === 0) return [];

      // Phase 2: Calculate bucket openTimes and batch lookup prices
      const bucketMap = new Map<number, number>(); // publishedOn(sec) → bucketOpenTime(ms)
      const bucketOpenTimes: number[] = [];

      for (const row of newsRows) {
        const publishedOnSec = Number(row.publishedOn);
        const bucketOpenTime = this.toBucket(publishedOnSec * 1000);
        bucketMap.set(publishedOnSec, bucketOpenTime);
        bucketOpenTimes.push(bucketOpenTime);
      }

      const priceMap = await this.batchLookupPrices(ticker, bucketOpenTimes);

      // Map results
      return newsRows.map((row: any) => {
        const publishedOnSec = Number(row.publishedOn);
        const bucketOpenTime = bucketMap.get(publishedOnSec)!;
        const closePrice = priceMap.get(bucketOpenTime) ?? null;

        return {
          newsId: Number(row.id),
          title: row.title,
          sourceName: row.sourceName,
          sentiment: row.sentiment,
          keywords: row.keywords,
          publishedOn: publishedOnSec * 1000,
          priceAtPublish: closePrice,
          ticker,
        };
      });
    } catch (error) {
      this.logger.error(
        `Failed to get news markers: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async getPriceImpact(
    newsId: number,
    ticker: string,
  ): Promise<PriceImpact | null> {
    try {
      // Query 1: Fetch news by ID
      const newsQuery = `
        SELECT id, title, sentiment, publishedOn
        FROM news FINAL
        WHERE id = {newsId:UInt64}
        LIMIT 1
      `;

      const newsResult = await this.clickhouse.query({
        query: newsQuery,
        query_params: { newsId },
        format: 'JSONEachRow',
      });
      const newsRows = await newsResult.json<any>();

      if (newsRows.length === 0) return null;

      const news = newsRows[0];
      const publishedOnSec = Number(news.publishedOn);
      const publishedOnMs = publishedOnSec * 1000;

      // Query 2: Calculate 5 bucket openTimes (publish + 4 offsets)
      const bucketPublish = this.toBucket(publishedOnMs);
      const bucket5m = bucketPublish + 1 * CANDLE_MS;
      const bucket15m = bucketPublish + 3 * CANDLE_MS;
      const bucket1h = bucketPublish + 12 * CANDLE_MS;
      const bucket4h = bucketPublish + 48 * CANDLE_MS;

      const allBuckets = [bucketPublish, bucket5m, bucket15m, bucket1h, bucket4h];
      const priceMap = await this.batchLookupPrices(ticker, allBuckets);

      const publishPrice = priceMap.get(bucketPublish) ?? null;

      const buildWindow = (bucketTime: number): PriceImpactWindow | null => {
        const price = priceMap.get(bucketTime);
        if (!price || !publishPrice) return null;
        const change =
          ((Number(price) - Number(publishPrice)) / Number(publishPrice)) * 100;
        return { price, changePercent: change.toFixed(4) };
      };

      return {
        newsId: Number(news.id),
        title: news.title,
        sentiment: news.sentiment,
        publishedOn: publishedOnMs,
        ticker,
        priceAtPublish: publishPrice,
        impact: {
          after5m: buildWindow(bucket5m),
          after15m: buildWindow(bucket15m),
          after1h: buildWindow(bucket1h),
          after4h: buildWindow(bucket4h),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get price impact for news ${newsId}: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async getImpactTable(
    ticker: string,
    fromTime: number,
    toTime: number,
    limit: number,
  ): Promise<ImpactTableRow[]> {
    const fromTimeSec = this.toSecond(fromTime);
    const toTimeSec = this.toSecond(toTime);

    try {
      // Phase 1: Fetch news
      const newsQuery = `
        SELECT id, title, sentiment, publishedOn
        FROM news FINAL
        WHERE publishedOn >= {fromTime:UInt64}
          AND publishedOn <= {toTime:UInt64}
        ORDER BY publishedOn DESC
        LIMIT {limit:UInt32}
      `;

      const newsResult = await this.clickhouse.query({
        query: newsQuery,
        query_params: { fromTime: fromTimeSec, toTime: toTimeSec, limit },
        format: 'JSONEachRow',
      });
      const newsRows = await newsResult.json<any>();

      if (newsRows.length === 0) return [];

      // Phase 2: Calculate buckets for publish, +15m, +1h
      const allBuckets: number[] = [];
      const newsData = newsRows.map((row: any) => {
        const publishedOnSec = Number(row.publishedOn);
        const publishedOnMs = publishedOnSec * 1000;
        const bucketPublish = this.toBucket(publishedOnMs);
        const bucket15m = bucketPublish + 3 * CANDLE_MS;
        const bucket1h = bucketPublish + 12 * CANDLE_MS;

        allBuckets.push(bucketPublish, bucket15m, bucket1h);

        return {
          newsId: Number(row.id),
          title: row.title,
          sentiment: row.sentiment,
          publishedOnMs,
          bucketPublish,
          bucket15m,
          bucket1h,
        };
      });

      const priceMap = await this.batchLookupPrices(ticker, allBuckets);

      return newsData.map((n: any) => {
        const publishPrice = priceMap.get(n.bucketPublish);

        const calcChange = (bucketTime: number): string | null => {
          const price = priceMap.get(bucketTime);
          if (!price || !publishPrice) return null;
          const change =
            ((Number(price) - Number(publishPrice)) / Number(publishPrice)) *
            100;
          return change.toFixed(4);
        };

        return {
          newsId: n.newsId,
          title: n.title,
          sentiment: n.sentiment,
          ticker,
          publishedOn: n.publishedOnMs,
          changePercent15m: calcChange(n.bucket15m),
          changePercent1h: calcChange(n.bucket1h),
        };
      });
    } catch (error) {
      this.logger.error(
        `Failed to get impact table: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async getSentimentCorrelation(
    ticker: string,
    fromTime: number,
    toTime: number,
  ): Promise<SentimentCorrelation[]> {
    const fromTimeSec = this.toSecond(fromTime);
    const toTimeSec = this.toSecond(toTime);

    try {
      // Step 1: Fetch news (hard-cap 100)
      const newsQuery = `
        SELECT id, sentiment, publishedOn
        FROM news FINAL
        WHERE publishedOn >= {fromTime:UInt64}
          AND publishedOn <= {toTime:UInt64}
        ORDER BY publishedOn DESC
        LIMIT {limit:UInt32}
      `;

      const newsResult = await this.clickhouse.query({
        query: newsQuery,
        query_params: {
          fromTime: fromTimeSec,
          toTime: toTimeSec,
          limit: SENTIMENT_NEWS_CAP,
        },
        format: 'JSONEachRow',
      });
      const newsRows = await newsResult.json<any>();

      if (newsRows.length === 0) return [];

      // Step 2: Collect all bucket openTimes (publish + 3 offsets per news)
      const allBuckets: number[] = [];
      const newsData = newsRows.map((row: any) => {
        const publishedOnSec = Number(row.publishedOn);
        const publishedOnMs = publishedOnSec * 1000;
        const bucketPublish = this.toBucket(publishedOnMs);
        const bucket15m = bucketPublish + 3 * CANDLE_MS;
        const bucket1h = bucketPublish + 12 * CANDLE_MS;
        const bucket4h = bucketPublish + 48 * CANDLE_MS;

        allBuckets.push(bucketPublish, bucket15m, bucket1h, bucket4h);

        return {
          sentiment: row.sentiment,
          bucketPublish,
          bucket15m,
          bucket1h,
          bucket4h,
        };
      });

      // Step 3: Single batch lookup
      const priceMap = await this.batchLookupPrices(ticker, allBuckets);

      // Step 4: Group by sentiment and compute avg change
      const groups = new Map<
        string,
        { count: number; changes15m: number[]; changes1h: number[]; changes4h: number[] }
      >();

      for (const n of newsData) {
        const publishPrice = priceMap.get(n.bucketPublish);
        if (!publishPrice) continue; // Skip news with data gap at publish time

        const calcChange = (bucketTime: number): number | null => {
          const price = priceMap.get(bucketTime);
          if (!price) return null;
          return (
            ((Number(price) - Number(publishPrice)) / Number(publishPrice)) *
            100
          );
        };

        const change15m = calcChange(n.bucket15m);
        const change1h = calcChange(n.bucket1h);
        const change4h = calcChange(n.bucket4h);

        // Only include if at least one offset has data
        if (change15m === null && change1h === null && change4h === null)
          continue;

        if (!groups.has(n.sentiment)) {
          groups.set(n.sentiment, {
            count: 0,
            changes15m: [],
            changes1h: [],
            changes4h: [],
          });
        }
        const group = groups.get(n.sentiment)!;
        group.count++;

        if (change15m !== null) group.changes15m.push(change15m);
        if (change1h !== null) group.changes1h.push(change1h);
        if (change4h !== null) group.changes4h.push(change4h);
      }

      // Step 5: Compute averages
      const avg = (arr: number[]): string =>
        arr.length > 0
          ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(4)
          : '0.0000';

      const result: SentimentCorrelation[] = [];
      for (const [sentiment, data] of groups) {
        result.push({
          sentiment,
          newsCount: data.count,
          avgChangePercent15m: avg(data.changes15m),
          avgChangePercent1h: avg(data.changes1h),
          avgChangePercent4h: avg(data.changes4h),
        });
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get sentiment correlation: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
