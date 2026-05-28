import { Injectable, Inject } from '@nestjs/common';
import { NEWS_REPOSITORY } from './constants';
import type { INewsRepository } from './interfaces/news-repository.interface';
import { NewsItem } from './interfaces/news-item.interface';

@Injectable()
export class NewsService {
  constructor(
    @Inject(NEWS_REPOSITORY)
    private readonly repository: INewsRepository,
  ) {}

  async getLatestNews(limit: number = 10): Promise<NewsItem[]> {
    return this.repository.getLatestNews(limit);
  }
}
