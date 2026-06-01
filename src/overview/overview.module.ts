import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OverviewController } from './overview.controller';
import { OverviewService } from './overview.service';
import { OVERVIEW_REPOSITORY } from './constants';
import { MockOverviewRepository } from './repositories/mock-overview.repository';
import { ClickHouseOverviewRepository } from './repositories/clickhouse-overview.repository';

@Module({
  imports: [ConfigModule],
  controllers: [OverviewController],
  providers: [
    OverviewService,
    {
      provide: OVERVIEW_REPOSITORY,
      useFactory: (configService: ConfigService, clickhouseRepository: ClickHouseOverviewRepository, mockRepository: MockOverviewRepository) => {
        const useMock = configService.get<string>('USE_MOCK') === 'true';
        return useMock ? mockRepository : clickhouseRepository;
      },
      inject: [ConfigService, ClickHouseOverviewRepository, MockOverviewRepository],
    },
    ClickHouseOverviewRepository,
    MockOverviewRepository,
  ],
})
export class OverviewModule {}
