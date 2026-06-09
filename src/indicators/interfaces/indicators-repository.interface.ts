/**
 * Dữ liệu nến OHLCV đã aggregate theo interval cho indicator calculations.
 * Bao gồm đủ OHLCV fields vì SQL cost gần như zero (cùng table scan)
 * và service layer hiện chỉ sử dụng close cho SMA/EMA/RSI/Bollinger.
 */
export interface IndicatorCandle {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  ma20?: string;
  ma50?: string;
  rsi?: string;
  bb_upper?: string;
  bb_lower?: string;
}

export interface IIndicatorsRepository {
  /**
   * Lấy dữ liệu OHLCV theo interval đã aggregate, sorted ASC by openTime.
   *
   * lookbackCandles: Số candles bổ sung cần fetch TRƯỚC fromTime
   * để "warm up" indicator (ví dụ MA50 cần 50 candles trước fromTime).
   * Repository tự tính adjustedFromTime = fromTime - lookbackCandles * interval.
   *
   * Tuân theo candle-boundary alignment contract giống kline repository:
   * chỉ trả về complete candles (HAVING count() = countNeeded).
   */
  getCandles(
    ticker: string,
    fromTime: number,
    toTime: number,
    interval: number,
  ): Promise<IndicatorCandle[]>;
}
