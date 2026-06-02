/** Một điểm dữ liệu MA/EMA tại một thời điểm cụ thể */
export interface MAPoint {
  openTime: number; // epoch ms — khớp với openTime của candle tương ứng
  value: string; // giá trị MA/EMA, string để giữ precision
}

/** Một điểm dữ liệu RSI tại một thời điểm cụ thể */
export interface RSIPoint {
  openTime: number;
  value: string; // 0-100
}

/** Một điểm dữ liệu Bollinger Bands */
export interface BollingerPoint {
  openTime: number;
  upper: string; // MA + k*stddev
  middle: string; // MA (SMA)
  lower: string; // MA - k*stddev
}

/**
 * Response shape tổng hợp — chỉ chứa các key mà caller yêu cầu.
 *
 * Nếu dữ liệu trong time range không đủ candles để tính một indicator
 * (ví dụ chỉ có 10 candles nhưng request MA50), field tương ứng sẽ là
 * mảng rỗng []. Frontend cần handle gracefully (không render overlay).
 */
export interface IndicatorResult {
  ticker: string;
  interval: number;
  ma20?: MAPoint[];
  ma50?: MAPoint[];
  ema20?: MAPoint[];
  ema50?: MAPoint[];
  rsi?: RSIPoint[];
  bollinger?: BollingerPoint[];
}
