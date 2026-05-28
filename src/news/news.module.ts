import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NEWS_REPOSITORY } from './constants';
import { MockNewsRepository } from './repositories/mock-news.repository';
import { MongoNewsRepository } from './repositories/mongo-news.repository';

@Module({
  controllers: [NewsController],
  providers: [
    NewsService,
    {
      provide: NEWS_REPOSITORY,
      useClass: process.env.USE_MOCK === 'true'
        ? MockNewsRepository
        : MongoNewsRepository,
    },
  ],
})
export class NewsModule {}
