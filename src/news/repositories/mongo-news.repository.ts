import { Injectable, NotImplementedException } from '@nestjs/common';
import { INewsRepository } from '../interfaces/news-repository.interface';
import { NewsItem } from '../interfaces/news-item.interface';

@Injectable()
export class MongoNewsRepository implements INewsRepository {
  async getLatestNews(limit: number): Promise<NewsItem[]> {
    throw new NotImplementedException('MongoDB schema is not available yet.');
  }
}
