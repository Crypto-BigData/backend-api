import { Injectable } from '@nestjs/common';
import { IIndicatorsRepository, IndicatorCandle } from '../interfaces/indicators-repository.interface';

@Injectable()
export class MockIndicatorsRepository implements IIndicatorsRepository {
  async getCandles(
    ticker: string,
    fromTime: number,
    toTime: number,
    interval: number,
  ): Promise<IndicatorCandle[]> {
    // Sinh dữ liệu giả lập quanh giá BTC ~65000 với biến động nhỏ.
    const candles: IndicatorCandle[] = [];

    let basePrice = ticker === 'BTCUSDT' ? 65000 : ticker === 'ETHUSDT' ? 3500 : 100;
    let currentTime = fromTime;

    while (currentTime <= toTime) {
      // Random walk nhỏ quanh basePrice
      const change = (Math.random() - 0.48) * basePrice * 0.005;
      basePrice += change;

      const open = basePrice;
      const high = basePrice * (1 + Math.random() * 0.003);
      const low = basePrice * (1 - Math.random() * 0.003);
      const close = basePrice + (Math.random() - 0.5) * basePrice * 0.002;
      const volume = 100 + Math.random() * 500;

      candles.push({
        openTime: currentTime,
        open: open.toFixed(2),
        high: high.toFixed(2),
        low: low.toFixed(2),
        close: close.toFixed(2),
        volume: volume.toFixed(4),
        ma20: (close * 1.001).toFixed(2),
        ma50: (close * 0.99).toFixed(2),
        rsi: (40 + Math.random() * 20).toFixed(2),
        bb_upper: (close * 1.02).toFixed(2),
        bb_lower: (close * 0.98).toFixed(2),
      });

      currentTime += interval;
    }

    return candles;
  }
}
