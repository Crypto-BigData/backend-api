import { Injectable, NotImplementedException } from '@nestjs/common';
import { INewsRepository, NewsPaginatedResult } from '../interfaces/news-repository.interface';
import { NewsItem } from '../interfaces/news-item.interface';

@Injectable()
export class ClickHouseNewsRepository implements INewsRepository {
  async getNews(
    fromTime: number,
    toTime: number,
    page: number,
    pageSize: number,
  ): Promise<NewsPaginatedResult> {
    throw new NotImplementedException(
      'ClickHouse news repository — sẽ được implement ở Task 1.4.',
    );
  }

  async getNewsLimit(
    fromTime: number,
    toTime: number,
    limit: number,
  ): Promise<NewsItem[]> {
    throw new NotImplementedException(
      'ClickHouse news repository — sẽ được implement ở Task 1.4.',
    );
  }
}
