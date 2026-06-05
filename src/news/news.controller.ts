import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { NewsService } from './news.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NewsQueryDto, NewsLimitQueryDto } from './dto/news-query.dto';
import { NewsPaginatedResponseDto, NewsItemDto } from './dto/news-response.dto';

@ApiTags('News')
@Controller('news')
@UseInterceptors(CacheInterceptor)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated news items' })
  @ApiResponse({ status: 200, description: 'Return paginated news', type: NewsPaginatedResponseDto })
  @CacheTTL(30000) // Cache 30s
  async getNews(@Query() query: NewsQueryDto) {
    // Defaults: nếu không truyền → lấy 7 ngày gần nhất (tính bằng ms để đồng bộ với MarketData)
    const now = Date.now();
    const from = query.fromTime ? Number(query.fromTime) : now - 7 * 24 * 60 * 60 * 1000;
    const to = query.toTime ? Number(query.toTime) : now;

    const filters = query.sentiment || query.category || query.source
      ? {
          sentiment: query.sentiment,
          category: query.category,
          source: query.source,
        }
      : undefined;

    return this.newsService.getNews(
      from, 
      to, 
      Number(query.page ?? '1'), 
      Number(query.pageSize ?? '20'),
      filters
    );
  }

  @Get('limit')
  @ApiOperation({ summary: 'Get latest news items up to a limit' })
  @ApiResponse({ status: 200, description: 'Return array of news items', type: [NewsItemDto] })
  @CacheTTL(30000) // Cache 30s
  async getNewsLimit(@Query() query: NewsLimitQueryDto) {
    const now = Date.now();
    const from = query.fromTime ? Number(query.fromTime) : now - 7 * 24 * 60 * 60 * 1000;
    const to = query.toTime ? Number(query.toTime) : now;

    return this.newsService.getNewsLimit(from, to, Number(query.limit ?? '10'));
  }
}
