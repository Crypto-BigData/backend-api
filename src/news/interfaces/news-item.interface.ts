/**
 * Domain model khớp với bảng ClickHouse `news`.
 *
 * publishedOn = epoch SECONDS (không phải ms!) — đúng với schema gốc.
 * sentiment = string ("positive" / "negative" / "neutral"), không phải float.
 *
 * Các trường text dài (rawBody, htmlBody) giữ nguyên để hỗ trợ
 * full-text search và hiển thị chi tiết trên frontend.
 */
export interface NewsItem {
  id: number;
  type: string;
  guid: string;
  url: string;
  publishedOn: number;
  imageUrl: string;
  title: string;
  subtitle: string;
  authors: string;
  sourceId: string;
  rawBody: string;
  keywords: string;
  sentiment: string;
  sourceName: string;
  categories: string;
  htmlBody: string;
}
