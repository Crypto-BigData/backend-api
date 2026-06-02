import { Injectable, Inject } from '@nestjs/common';
import { INDICATORS_REPOSITORY } from './constants';
import type { IIndicatorsRepository } from './interfaces/indicators-repository.interface';
import {
  IndicatorResult,
  MAPoint,
  RSIPoint,
  BollingerPoint,
} from './interfaces/indicator-result.interface';

/** Indicator periods chuẩn ngành — fixed, không expose qua API */
const PERIODS = {
  MA20: 20,
  MA50: 50,
  EMA20: 20,
  EMA50: 50,
  RSI: 14,
  BOLLINGER: 20,
  BOLLINGER_K: 2,
} as const;

@Injectable()
export class IndicatorsService {
  constructor(
    @Inject(INDICATORS_REPOSITORY)
    private readonly repository: IIndicatorsRepository,
  ) {}

  async calculate(
    ticker: string,
    fromTime: number,
    toTime: number,
    interval: number,
    indicators: string[],
  ): Promise<IndicatorResult> {
    // Tính lookback: lấy max period trong tất cả indicators được yêu cầu, +1 buffer.
    //
    // +1 đồng thời cover 2 edge case (KHÔNG phải 2 lần +1 riêng biệt):
    //   1. RSI diff: RSI(14) cần 15 closes (14 diffs). Khi chỉ request RSI,
    //      maxLookback = 15. Nếu boundary drop 1 → 14 warmup + first in-range = đủ.
    //   2. Boundary buffer: HAVING count() = countNeeded có thể drop candle đầu
    //      nếu adjustedFromTime rơi giữa bucket. +1 bù cho trường hợp này.
    const maxLookback = this.computeMaxLookback(indicators) + 1;

    const candles = await this.repository.getCandles(
      ticker,
      fromTime,
      toTime,
      interval,
      maxLookback,
    );

    const closes = candles.map((c) => Number(c.close));
    const openTimes = candles.map((c) => c.openTime);

    const result: IndicatorResult = { ticker, interval };

    if (indicators.includes('ma')) {
      result.ma20 = this.trimToRange(
        this.computeSMA(closes, openTimes, PERIODS.MA20),
        fromTime,
      );
      result.ma50 = this.trimToRange(
        this.computeSMA(closes, openTimes, PERIODS.MA50),
        fromTime,
      );
    }

    if (indicators.includes('ema')) {
      result.ema20 = this.trimToRange(
        this.computeEMA(closes, openTimes, PERIODS.EMA20),
        fromTime,
      );
      result.ema50 = this.trimToRange(
        this.computeEMA(closes, openTimes, PERIODS.EMA50),
        fromTime,
      );
    }

    if (indicators.includes('rsi')) {
      result.rsi = this.trimToRange(
        this.computeRSI(closes, openTimes, PERIODS.RSI),
        fromTime,
      );
    }

    if (indicators.includes('bb')) {
      result.bollinger = this.trimToRange(
        this.computeBollinger(closes, openTimes, PERIODS.BOLLINGER, PERIODS.BOLLINGER_K),
        fromTime,
      );
    }

    return result;
  }

  /**
   * Tính max period cần thiết dựa trên danh sách indicators yêu cầu.
   */
  private computeMaxLookback(indicators: string[]): number {
    const periods: number[] = [];

    if (indicators.includes('ma')) {
      periods.push(PERIODS.MA20, PERIODS.MA50);
    }
    if (indicators.includes('ema')) {
      periods.push(PERIODS.EMA20, PERIODS.EMA50);
    }
    if (indicators.includes('rsi')) {
      periods.push(PERIODS.RSI);
    }
    if (indicators.includes('bb')) {
      periods.push(PERIODS.BOLLINGER);
    }

    return periods.length > 0 ? Math.max(...periods) : 0;
  }

  /**
   * SMA — Simple Moving Average.
   * Sliding window: tổng cộng dồn, output bắt đầu khi đủ `period` candles.
   * Trả mảng rỗng nếu data < period.
   */
  private computeSMA(
    closes: number[],
    openTimes: number[],
    period: number,
  ): MAPoint[] {
    if (closes.length < period) return [];

    const points: MAPoint[] = [];
    let sum = 0;

    for (let i = 0; i < closes.length; i++) {
      sum += closes[i];
      if (i >= period) {
        sum -= closes[i - period];
      }
      if (i >= period - 1) {
        points.push({
          openTime: openTimes[i],
          value: (sum / period).toFixed(8),
        });
      }
    }

    return points;
  }

  /**
   * EMA — Exponential Moving Average.
   * EMA seeded by SMA(period) — convention chuẩn TradingView/Investopedia.
   * Một số thư viện khác seed bằng close[0], nhưng SMA seed cho kết quả
   * ổn định hơn và phổ biến hơn.
   */
  private computeEMA(
    closes: number[],
    openTimes: number[],
    period: number,
  ): MAPoint[] {
    if (closes.length < period) return [];

    const multiplier = 2 / (period + 1);
    const points: MAPoint[] = [];

    // Seed EMA bằng SMA của `period` giá đầu tiên
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += closes[i];
    }
    let ema = sum / period;

    points.push({
      openTime: openTimes[period - 1],
      value: ema.toFixed(8),
    });

    // Tính EMA cho các candle tiếp theo
    for (let i = period; i < closes.length; i++) {
      ema = closes[i] * multiplier + ema * (1 - multiplier);
      points.push({
        openTime: openTimes[i],
        value: ema.toFixed(8),
      });
    }

    return points;
  }

  /**
   * RSI — Relative Strength Index (Wilder's Smoothed, 14 periods mặc định).
   *
   * Thuật toán:
   * 1. Tính gain/loss giữa 2 close liên tiếp (cần period+1 closes tối thiểu)
   * 2. avgGain[0] = simple avg(gains[0..period-1])
   * 3. avgGain[i] = (avgGain[i-1] * (period-1) + gain[i]) / period  (Wilder's smoothing)
   * 4. RS = avgGain / avgLoss, RSI = 100 - 100/(1+RS)
   */
  private computeRSI(
    closes: number[],
    openTimes: number[],
    period: number,
  ): RSIPoint[] {
    // RSI cần ít nhất period + 1 closes (period diffs)
    if (closes.length < period + 1) return [];

    const points: RSIPoint[] = [];

    // Tính diffs (gain/loss)
    const gains: number[] = [];
    const losses: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? -diff : 0);
    }

    // Seed: simple average của `period` giá trị đầu tiên
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 0; i < period; i++) {
      avgGain += gains[i];
      avgLoss += losses[i];
    }
    avgGain /= period;
    avgLoss /= period;

    // RSI tại vị trí period (index trong mảng closes là period)
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    points.push({
      openTime: openTimes[period],
      value: rsi.toFixed(2),
    });

    // Wilder's smoothing cho các giá trị tiếp theo
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

      const currentRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const currentRsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + currentRs);

      points.push({
        openTime: openTimes[i + 1],
        value: currentRsi.toFixed(2),
      });
    }

    return points;
  }

  /**
   * Bollinger Bands — SMA(period) ± k * population stddev.
   *
   * Dùng population stddev (chia period, không phải period-1) — đúng theo
   * định nghĩa gốc của John Bollinger và convention TradingView.
   *
   * Sliding window O(n) sử dụng variance identity: var = E[X²] - E[X]²
   * để tránh tính lại SMA từ đầu mỗi iteration (nhất quán với computeSMA).
   */
  private computeBollinger(
    closes: number[],
    openTimes: number[],
    period: number,
    k: number,
  ): BollingerPoint[] {
    if (closes.length < period) return [];

    const points: BollingerPoint[] = [];
    let sum = 0;
    let sumSq = 0;

    for (let i = 0; i < closes.length; i++) {
      sum += closes[i];
      sumSq += closes[i] * closes[i];

      if (i >= period) {
        sum -= closes[i - period];
        sumSq -= closes[i - period] * closes[i - period];
      }

      if (i >= period - 1) {
        const middle = sum / period;
        // Population variance: E[X²] - (E[X])²
        const variance = sumSq / period - middle * middle;
        // Guard against floating point rounding producing tiny negative values
        const stddev = Math.sqrt(Math.max(0, variance));

        points.push({
          openTime: openTimes[i],
          upper: (middle + k * stddev).toFixed(8),
          middle: middle.toFixed(8),
          lower: (middle - k * stddev).toFixed(8),
        });
      }
    }

    return points;
  }

  /**
   * Trim bỏ các điểm thuộc vùng warmup (openTime < fromTime).
   * Candle openTime luôn là boundary-aligned (do bucket aggregation),
   * nên phép so sánh < tự nhiên loại bỏ toàn bộ lookback data.
   */
  private trimToRange<T extends { openTime: number }>(
    points: T[],
    fromTime: number,
  ): T[] {
    return points.filter((p) => p.openTime >= fromTime);
  }
}
