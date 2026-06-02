import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IndicatorsController } from './indicators.controller';
import { IndicatorsService } from './indicators.service';
import { INDICATORS_REPOSITORY } from './constants';
import { MockIndicatorsRepository } from './repositories/mock-indicators.repository';
import { ClickHouseIndicatorsRepository } from './repositories/clickhouse-indicators.repository';

@Module({
  imports: [ConfigModule],
  controllers: [IndicatorsController],
  providers: [
    IndicatorsService,
    {
      provide: INDICATORS_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        clickhouseRepository: ClickHouseIndicatorsRepository,
        mockRepository: MockIndicatorsRepository,
      ) => {
        const useMock = configService.get<string>('USE_MOCK') === 'true';
        return useMock ? mockRepository : clickhouseRepository;
      },
      inject: [ConfigService, ClickHouseIndicatorsRepository, MockIndicatorsRepository],
    },
    ClickHouseIndicatorsRepository,
    MockIndicatorsRepository,
  ],
})
export class IndicatorsModule {}
