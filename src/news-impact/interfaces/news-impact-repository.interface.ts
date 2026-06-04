import { NewsMarker, PriceImpact, ImpactTableRow, SentimentCorrelation } from './news-impact-result.interface';

/**
 * fromTime/toTime = epoch milliseconds (nhất quán Time Unit Contract).
 * Repository chịu trách nhiệm convert ms → seconds khi query bảng news.
 */
export interface INewsImpactRepository {
  /**
   * Lấy danh sách news markers kèm giá tại thời điểm publish.
   * 2-phase query: query news → bucket calc → equality IN lookup trên kline.
   */
  getNewsMarkers(
    ticker: string,
    fromTime: number,
    toTime: number,
    limit: number,
  ): Promise<NewsMarker[]>;

  /**
   * Tính price impact cho 1 tin cụ thể.
   * Lookup giá tại 5 mốc: publish, +5m, +15m, +1h, +4h (bucket offset).
   * Trả null nếu newsId không tồn tại.
   */
  getPriceImpact(
    newsId: number,
    ticker: string,
  ): Promise<PriceImpact | null>;

  /**
   * Batch version: lấy danh sách tin kèm price change tại +15m và +1h.
   * 2-phase query giống getNewsMarkers nhưng thêm offset buckets.
   */
  getImpactTable(
    ticker: string,
    fromTime: number,
    toTime: number,
    limit: number,
  ): Promise<ImpactTableRow[]>;

  /**
   * Aggregate: nhóm tin theo sentiment, tính avg price change.
   * Hard-cap 100 tin mới nhất để kiểm soát IN clause size.
   */
  getSentimentCorrelation(
    ticker: string,
    fromTime: number,
    toTime: number,
  ): Promise<SentimentCorrelation[]>;
}
