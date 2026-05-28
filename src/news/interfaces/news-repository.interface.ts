import { NewsItem } from './news-item.interface';

export interface INewsRepository {
  getLatestNews(limit: number): Promise<NewsItem[]>;
}
