import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ClickHouseClient } from '@clickhouse/client';
import { INewsRepository, NewsPaginatedResult } from '../interfaces/news-repository.interface';
import { NewsItem } from '../interfaces/news-item.interface';
import { NewsFilterParams } from '../interfaces/news-filter.interface';
import { CLICKHOUSE_CLIENT } from '../../config/clickhouse.module';

@Injectable()
export class ClickHouseNewsRepository implements INewsRepository {
  private readonly logger = new Logger(ClickHouseNewsRepository.name);

  constructor(
    @Inject(CLICKHOUSE_CLIENT)
    private readonly clickhouse: ClickHouseClient,
  ) {}

  private toSecond(ms: number): number {
    return Math.floor(ms / 1000);
  }

  private mapRowToNewsItem(row: any): NewsItem {
    return {
      ...row,
      // ClickHouse client returns UInt64 as string by default, cast to number
      id: Number(row.id),
      publishedOn: Number(row.publishedOn),
    };
  }

  async getNews(
    fromTime: number,
    toTime: number,
    page: number,
    pageSize: number,
    filters?: NewsFilterParams,
  ): Promise<NewsPaginatedResult> {
    const offset = (page - 1) * pageSize;
    const fromTimeSec = this.toSecond(fromTime);
    const toTimeSec = this.toSecond(toTime);

    let whereClause = `
      WHERE publishedOn >= {fromTime:UInt64}
        AND publishedOn <= {toTime:UInt64}
    `;

    const queryParams: Record<string, any> = {
      fromTime: fromTimeSec,
      toTime: toTimeSec,
    };

    if (filters) {
      if (filters.sentiment) {
        whereClause += ` AND sentiment = {sentiment:String}`;
        queryParams.sentiment = filters.sentiment;
      }
      if (filters.category) {
        // Trade-off note: categories is stored as JSON array string e.g., '["Bitcoin","DeFi"]'.
        // positionCaseInsensitive might match substrings (e.g. searching 'BTC' matches 'BTCUSDT').
        // This is accepted for MVP to avoid expensive JSON parsing in SQL.
        whereClause += ` AND positionCaseInsensitive(categories, {category:String}) > 0`;
        queryParams.category = filters.category;
      }
      if (filters.source) {
        whereClause += ` AND positionCaseInsensitive(sourceName, {source:String}) > 0`;
        queryParams.source = filters.source;
      }
    }

    // We use FINAL because the table uses ReplacingMergeTree engine
    const dataQuery = `
      SELECT *
      FROM news FINAL
      ${whereClause}
      ORDER BY publishedOn DESC
      LIMIT {limit:UInt32} OFFSET {offset:UInt32}
    `;

    const countQuery = `
      SELECT count() as total
      FROM news FINAL
      ${whereClause}
    `;

    try {
      // Execute both queries in parallel
      const [dataResult, countResult] = await Promise.all([
        this.clickhouse.query({
          query: dataQuery,
          query_params: {
            ...queryParams,
            limit: pageSize,
            offset,
          },
          format: 'JSONEachRow',
        }),
        this.clickhouse.query({
          query: countQuery,
          query_params: queryParams,
          format: 'JSONEachRow',
        }),
      ]);

      const rawData = await dataResult.json<any>();
      const rawCount = await countResult.json<{ total: string }>();

      const data = rawData.map(this.mapRowToNewsItem);
      const total = rawCount.length > 0 ? Number(rawCount[0].total) : 0;

      return {
        data,
        total,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch paginated news from ClickHouse: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async getNewsLimit(
    fromTime: number,
    toTime: number,
    limit: number,
  ): Promise<NewsItem[]> {
    const fromTimeSec = this.toSecond(fromTime);
    const toTimeSec = this.toSecond(toTime);
    const query = `
      SELECT *
      FROM news FINAL
      WHERE publishedOn >= {fromTime:UInt64}
        AND publishedOn <= {toTime:UInt64}
      ORDER BY publishedOn DESC
      LIMIT {limit:UInt32}
    `;

    try {
      const resultSet = await this.clickhouse.query({
        query,
        query_params: {
          fromTime: fromTimeSec,
          toTime: toTimeSec,
          limit,
        },
        format: 'JSONEachRow',
      });

      const rawData = await resultSet.json<any>();
      return rawData.map(this.mapRowToNewsItem);
    } catch (error) {
      this.logger.error(
        `Failed to fetch limited news from ClickHouse: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
