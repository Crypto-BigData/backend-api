import { Injectable, Inject } from '@nestjs/common';
import { OVERVIEW_REPOSITORY } from './constants';
import type { IOverviewRepository } from './interfaces/overview-repository.interface';
import { MarketSummary } from './interfaces/market-summary.interface';
import { TopMover } from './interfaces/top-mover.interface';
import { VolumeSpike } from './interfaces/volume-spike.interface';

@Injectable()
export class OverviewService {
  constructor(
    @Inject(OVERVIEW_REPOSITORY)
    private readonly repository: IOverviewRepository,
  ) {}

  async getMarketSummary(): Promise<MarketSummary> {
    return this.repository.getMarketSummary();
  }

  async getTopMovers(): Promise<TopMover[]> {
    return this.repository.getTopMovers();
  }

  async getVolumeSpikes(threshold: number, limit: number): Promise<VolumeSpike[]> {
    return this.repository.getVolumeSpikes(threshold, limit);
  }
}
