import { Injectable, Inject } from '@nestjs/common';
import { INDICATORS_REPOSITORY } from './constants';
import type { IIndicatorsRepository } from './interfaces/indicators-repository.interface';
import {
  IndicatorResult,
} from './interfaces/indicator-result.interface';

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
    const candles = await this.repository.getCandles(
      ticker,
      fromTime,
      toTime,
      interval,
    );

    const result: IndicatorResult = { ticker, interval };

    // DUMB API: Do not compute or map indicators for timeframes > 5m.
    // Financial indicators must be computed natively on their respective timeframes.
    // Since our Spark pipeline currently only computes on 5m data, we return empty.
    if (interval !== 300_000) {
      return result;
    }

    if (indicators.includes('ma')) {
      result.ma20 = candles
        .filter((c) => c.ma20)
        .map((c) => ({
          openTime: c.openTime,
          value: c.ma20 as string,
        }));
      result.ma50 = candles
        .filter((c) => c.ma50)
        .map((c) => ({
          openTime: c.openTime,
          value: c.ma50 as string,
        }));
    }

    if (indicators.includes('rsi')) {
      result.rsi = candles
        .filter((c) => c.rsi)
        .map((c) => ({
          openTime: c.openTime,
          value: c.rsi as string,
        }));
    }

    if (indicators.includes('bb')) {
      result.bollinger = candles
        .filter((c) => c.bb_upper && c.bb_lower && c.ma20)
        .map((c) => ({
          openTime: c.openTime,
          upper: c.bb_upper as string,
          middle: c.ma20 as string, // MA20 is exactly the BB middle band
          lower: c.bb_lower as string,
        }));
    }

    return result;
  }
}
