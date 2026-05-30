import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { NewsService } from './news.service';

@Controller('news')
@UseInterceptors(CacheInterceptor)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @CacheTTL(30000) // Cache 30s
  async getNews(
    @Query('fromTime') fromTime?: string,
    @Query('toTime') toTime?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    // Defaults: nếu không truyền → lấy 7 ngày gần nhất (tính bằng ms để đồng bộ với MarketData)
    const now = Date.now();
    const from = fromTime ? Number(fromTime) : now - 7 * 24 * 60 * 60 * 1000;
    const to = toTime ? Number(toTime) : now;

    return this.newsService.getNews(from, to, Number(page), Number(pageSize));
  }

  @Get('limit')
  @CacheTTL(30000) // Cache 30s
  async getNewsLimit(
    @Query('fromTime') fromTime?: string,
    @Query('toTime') toTime?: string,
    @Query('limit') limit: string = '10',
  ) {
    const now = Date.now();
    const from = fromTime ? Number(fromTime) : now - 7 * 24 * 60 * 60 * 1000;
    const to = toTime ? Number(toTime) : now;

    return this.newsService.getNewsLimit(from, to, Number(limit));
  }
}
