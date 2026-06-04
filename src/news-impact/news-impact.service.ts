import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { NEWS_IMPACT_REPOSITORY } from './constants';
import type { INewsImpactRepository } from './interfaces/news-impact-repository.interface';
import { NewsMarker } from './interfaces/news-impact-result.interface';
import { PriceImpact } from './interfaces/news-impact-result.interface';
import { ImpactTableRow } from './interfaces/news-impact-result.interface';
import { SentimentCorrelation } from './interfaces/news-impact-result.interface';

/** Max cap để kiểm soát query size. Impact-table thấp hơn markers vì mỗi row cần thêm kline lookups. */
const MAX_MARKERS_LIMIT = 200;
const MAX_IMPACT_TABLE_LIMIT = 100;

@Injectable()
export class NewsImpactService {
  constructor(
    @Inject(NEWS_IMPACT_REPOSITORY)
    private readonly repository: INewsImpactRepository,
  ) {}

  private validateTimeRange(fromTime: number, toTime: number): void {
    if (fromTime >= toTime) {
      throw new BadRequestException('fromTime must be less than toTime');
    }
  }

  async getNewsMarkers(
    ticker: string,
    fromTime: number,
    toTime: number,
    limit: number,
  ): Promise<NewsMarker[]> {
    this.validateTimeRange(fromTime, toTime);
    const cappedLimit = Math.min(limit, MAX_MARKERS_LIMIT);
    return this.repository.getNewsMarkers(ticker, fromTime, toTime, cappedLimit);
  }

  async getPriceImpact(
    newsId: number,
    ticker: string,
  ): Promise<PriceImpact> {
    const result = await this.repository.getPriceImpact(newsId, ticker);
    if (!result) {
      throw new NotFoundException(`News item with id ${newsId} not found`);
    }
    return result;
  }

  async getImpactTable(
    ticker: string,
    fromTime: number,
    toTime: number,
    limit: number,
  ): Promise<ImpactTableRow[]> {
    this.validateTimeRange(fromTime, toTime);
    const cappedLimit = Math.min(limit, MAX_IMPACT_TABLE_LIMIT);
    return this.repository.getImpactTable(ticker, fromTime, toTime, cappedLimit);
  }

  async getSentimentCorrelation(
    ticker: string,
    fromTime: number,
    toTime: number,
  ): Promise<SentimentCorrelation[]> {
    this.validateTimeRange(fromTime, toTime);
    return this.repository.getSentimentCorrelation(ticker, fromTime, toTime);
  }
}
