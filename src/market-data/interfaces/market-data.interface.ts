/**
 * Domain model khớp với bảng ClickHouse `future_kline_5m`.
 *
 * Tất cả giá trị Decimal gốc (Decimal(38,18)) được giữ dạng string
 * để tránh mất precision khi serialize qua JSON.
 *
 * openTime / closeTime = epoch milliseconds (UInt64 trong ClickHouse).
 */
export interface MarketData {
  ticker: string;
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}
