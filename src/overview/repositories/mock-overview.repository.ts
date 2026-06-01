import { Injectable } from '@nestjs/common';
import { IOverviewRepository } from '../interfaces/overview-repository.interface';
import { MarketSummary } from '../interfaces/market-summary.interface';
import { TopMover } from '../interfaces/top-mover.interface';
import { VolumeSpike } from '../interfaces/volume-spike.interface';

@Injectable()
export class MockOverviewRepository implements IOverviewRepository {
  async getMarketSummary(): Promise<MarketSummary> {
    return {
      btcPrice: '65432.10',
      btcChange24h: '2.5',
      ethPrice: '3456.78',
      ethChange24h: '-1.2',
      generalSentiment: {
        positive: 45,
        neutral: 20,
        negative: 10,
      },
    };
  }

  async getTopMovers(): Promise<TopMover[]> {
    return [
      { ticker: 'PEPEUSDT', lastPrice: '0.00000850', priceChangePercent24h: '15.5', type: 'gainer' },
      { ticker: 'DOGEUSDT', lastPrice: '0.1500', priceChangePercent24h: '8.2', type: 'gainer' },
      { ticker: 'SOLUSDT', lastPrice: '145.20', priceChangePercent24h: '5.4', type: 'gainer' },
      { ticker: 'AVAXUSDT', lastPrice: '35.10', priceChangePercent24h: '4.1', type: 'gainer' },
      { ticker: 'BNBUSDT', lastPrice: '590.50', priceChangePercent24h: '3.0', type: 'gainer' },
      { ticker: 'WIFUSDT', lastPrice: '2.10', priceChangePercent24h: '-12.5', type: 'loser' },
      { ticker: 'BONKUSDT', lastPrice: '0.000021', priceChangePercent24h: '-9.8', type: 'loser' },
      { ticker: 'ADAUSDT', lastPrice: '0.4500', priceChangePercent24h: '-5.2', type: 'loser' },
      { ticker: 'XRPUSDT', lastPrice: '0.5100', priceChangePercent24h: '-4.1', type: 'loser' },
      { ticker: 'DOTUSDT', lastPrice: '6.80', priceChangePercent24h: '-3.0', type: 'loser' },
    ];
  }

  async getVolumeSpikes(threshold: number, limit: number): Promise<VolumeSpike[]> {
    return [
      { ticker: 'PEPEUSDT', lastVolume24h: '15000000', averageVolume7d: '3000000', spikeRatio: '5.0' },
      { ticker: 'WIFUSDT', lastVolume24h: '8000000', averageVolume7d: '2000000', spikeRatio: '4.0' },
      { ticker: 'DOGEUSDT', lastVolume24h: '50000000', averageVolume7d: '20000000', spikeRatio: '2.5' },
    ].filter(s => parseFloat(s.spikeRatio) > threshold).slice(0, limit);
  }
}
