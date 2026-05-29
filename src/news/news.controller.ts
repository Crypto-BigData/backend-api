import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { NewsService } from './news.service';

@Controller('news')
@UseInterceptors(CacheInterceptor)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get('latest')
  @CacheTTL(30000) // Cache 30s
  async getLatestNews(@Query('limit') limit: number = 10) {
    return this.newsService.getLatestNews(Number(limit));
  }
}
