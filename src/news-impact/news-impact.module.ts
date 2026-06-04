import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NewsImpactController } from './news-impact.controller';
import { NewsImpactService } from './news-impact.service';
import { NEWS_IMPACT_REPOSITORY } from './constants';
import { MockNewsImpactRepository } from './repositories/mock-news-impact.repository';
import { ClickHouseNewsImpactRepository } from './repositories/clickhouse-news-impact.repository';

@Module({
  imports: [ConfigModule],
  controllers: [NewsImpactController],
  providers: [
    NewsImpactService,
    {
      provide: NEWS_IMPACT_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        clickhouseRepository: ClickHouseNewsImpactRepository,
        mockRepository: MockNewsImpactRepository,
      ) => {
        const useMock = configService.get<string>('USE_MOCK') === 'true';
        return useMock ? mockRepository : clickhouseRepository;
      },
      inject: [ConfigService, ClickHouseNewsImpactRepository, MockNewsImpactRepository],
    },
    ClickHouseNewsImpactRepository,
    MockNewsImpactRepository,
  ],
})
export class NewsImpactModule {}
