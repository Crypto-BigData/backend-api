/**
 * Marker hiển thị trên chart — gồm thông tin tin tức + giá tại thời điểm publish.
 * publishedOn đã convert sang epoch MS (nhất quán Time Unit Contract).
 * priceAtPublish = null khi data gap — FE vẫn hiển thị marker, ẩn price trong popup.
 */
export interface NewsMarker {
  newsId: number;
  title: string;
  sourceName: string;
  sentiment: string;
  keywords: string;
  publishedOn: number;
  priceAtPublish: string | null;
  ticker: string;
}

/**
 * Kết quả price change tại 1 mốc thời gian sau publish.
 * changePercent giữ dạng string (.toFixed(4)) theo convention codebase.
 */
export interface PriceImpactWindow {
  price: string;
  changePercent: string;
}

/**
 * Price impact chi tiết cho 1 tin cụ thể.
 * Mỗi impact window = null nếu data gap (nến không tồn tại tại bucket time).
 */
export interface PriceImpact {
  newsId: number;
  title: string;
  sentiment: string;
  publishedOn: number;
  ticker: string;
  priceAtPublish: string | null;
  impact: {
    after5m: PriceImpactWindow | null;
    after15m: PriceImpactWindow | null;
    after1h: PriceImpactWindow | null;
    after4h: PriceImpactWindow | null;
  };
}

/**
 * Lightweight row cho impact table (fe-be.md §6.5).
 * Chỉ bao gồm +15m và +1h để giữ bảng gọn.
 */
export interface ImpactTableRow {
  newsId: number;
  title: string;
  sentiment: string;
  ticker: string;
  publishedOn: number;
  changePercent15m: string | null;
  changePercent1h: string | null;
}

/**
 * Aggregate sentiment → avg price change.
 * Tin có data gap bị skip khỏi aggregate (không đếm vào newsCount).
 */
export interface SentimentCorrelation {
  sentiment: string;
  newsCount: number;
  avgChangePercent15m: string;
  avgChangePercent1h: string;
  avgChangePercent4h: string;
}
