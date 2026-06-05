import { Injectable, Inject } from '@nestjs/common';
import { NEWS_REPOSITORY } from './constants';
import type { INewsRepository, NewsPaginatedResult } from './interfaces/news-repository.interface';
import { NewsItem } from './interfaces/news-item.interface';
import { NewsFilterParams } from './interfaces/news-filter.interface';

@Injectable()
export class NewsService {
  constructor(
    @Inject(NEWS_REPOSITORY)
    private readonly repository: INewsRepository,
  ) {}

  async getNews(
    fromTime: number,
    toTime: number,
    page: number,
    pageSize: number,
    filters?: NewsFilterParams,
  ): Promise<NewsPaginatedResult> {
    return this.repository.getNews(fromTime, toTime, page, pageSize, filters);
  }

  async getNewsLimit(
    fromTime: number,
    toTime: number,
    limit: number,
  ): Promise<NewsItem[]> {
    return this.repository.getNewsLimit(fromTime, toTime, limit);
  }
}
