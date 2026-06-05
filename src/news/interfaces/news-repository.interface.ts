import { NewsItem } from './news-item.interface';
import { NewsFilterParams } from './news-filter.interface';

/**
 * Kết quả trả về từ getNews, bao gồm dữ liệu + tổng số bản ghi.
 */
export interface NewsPaginatedResult {
  data: NewsItem[];
  total: number;
}

/**
 * fromTime/toTime = epoch milliseconds. getNews trả về kèm total count cho pagination.
 */
export interface INewsRepository {
  getNews(
    fromTime: number,
    toTime: number,
    page: number,
    pageSize: number,
    filters?: NewsFilterParams,
  ): Promise<NewsPaginatedResult>;

  getNewsLimit(
    fromTime: number,
    toTime: number,
    limit: number,
  ): Promise<NewsItem[]>;
}
