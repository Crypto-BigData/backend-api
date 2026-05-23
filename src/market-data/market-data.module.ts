import { Module } from '@nestjs/common';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { MARKET_DATA_REPOSITORY } from './constants';
import { MockMarketDataRepository } from './repositories/mock-market-data.repository';
import { ClickHouseMarketDataRepository } from './repositories/clickhouse-market-data.repository';

@Module({
  controllers: [MarketDataController],
  providers: [
    MarketDataService,
    {
      provide: MARKET_DATA_REPOSITORY,
      useClass: process.env.USE_MOCK === 'true'
        ? MockMarketDataRepository
        : ClickHouseMarketDataRepository,
    },
  ],
})
export class MarketDataModule {}
