import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NEWS_REPOSITORY } from './constants';
import { MockNewsRepository } from './repositories/mock-news.repository';
import { ClickHouseNewsRepository } from './repositories/clickhouse-news.repository';

@Module({
  controllers: [NewsController],
  providers: [
    NewsService,
    {
      provide: NEWS_REPOSITORY,
      useClass: process.env.USE_MOCK === 'true'
        ? MockNewsRepository
        : ClickHouseNewsRepository,
    },
  ],
})
export class NewsModule {}
