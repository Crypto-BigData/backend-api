/**
 * Adapter gọi Binance Futures public REST API bằng native fetch.
 * Không cần API key — chỉ dùng public endpoints.
 */

const BINANCE_FUTURES_BASE = 'https://fapi.binance.com';

export interface BinanceTicker {
  symbol: string;
  price: string;
  time: number;
}

/**
 * Lấy danh sách tất cả Futures tickers đang active.
 * Endpoint: GET /fapi/v2/ticker/price
 */
export async function getFutureTickers(): Promise<BinanceTicker[]> {
  const res = await fetch(`${BINANCE_FUTURES_BASE}/fapi/v2/ticker/price`);

  if (!res.ok) {
    throw new Error(`Binance getFutureTickers failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<BinanceTicker[]>;
}

/**
 * Lấy klines (candlestick) cho một ticker.
 * Endpoint: GET /fapi/v1/klines
 *
 * @param ticker    - VD: 'BTCUSDT'
 * @param interval  - VD: '5m'
 * @param startTime - epoch milliseconds
 * @param limit     - số lượng candles (max 1500)
 * @returns Mảng các mảng raw kline data từ Binance
 */
export async function getFuturesKlines(
  ticker: string,
  interval: string,
  startTime: number,
  limit: number,
): Promise<any[][]> {
  const params = new URLSearchParams({
    symbol: ticker,
    interval,
    startTime: String(startTime),
    limit: String(limit),
  });

  const res = await fetch(
    `${BINANCE_FUTURES_BASE}/fapi/v1/klines?${params.toString()}`,
  );

  if (!res.ok) {
    throw new Error(
      `Binance getFuturesKlines failed for ${ticker}: ${res.status} ${res.statusText}`,
    );
  }

  return res.json() as Promise<any[][]>;
}

/**
 * Làm tròn timestamp xuống boundary của interval (VD: boundary 5m).
 * Đảm bảo startTime gửi cho Binance luôn khớp với mốc nến.
 */
export function alignTimestamp(timestampMs: number, intervalMs: number): number {
  return Math.floor(timestampMs / intervalMs) * intervalMs;
}
