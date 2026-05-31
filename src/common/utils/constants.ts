export const DEFAULT_INTERVAL = '5m';
export const DEFAULT_INTERVAL_MS = 300_000; // 5 minutes in milliseconds

/**
 * Binance cho phép tối đa 1000 candles/request.
 * Giới hạn ở 95 để giữ payload nhỏ gọn và giảm áp lực rate limit
 * khi phải fetch song song nhiều tickers cùng lúc.
 * Với 95 candles × 5m = ~8 giờ dữ liệu mỗi request — đủ cho sync mỗi phút.
 */
export const MAX_CANDLES_PER_REQUEST = 95;

/** Redis keys dùng bởi Worker */
export enum RedisKey {
  BINANCE_TICKERS = 'binance_tickers',
  LOCK_SYNC_NEW_KLINE = 'lock:sync_new_kline',
  LOCK_SYNC_OLD_KLINE = 'lock:sync_old_kline',
}
