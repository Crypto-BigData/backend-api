import { MarketSummary } from './market-summary.interface';
import { TopMover } from './top-mover.interface';
import { VolumeSpike } from './volume-spike.interface';

export interface IOverviewRepository {
  getMarketSummary(): Promise<MarketSummary>;
  getTopMovers(): Promise<TopMover[]>;
  getVolumeSpikes(threshold: number, limit: number): Promise<VolumeSpike[]>;
}
