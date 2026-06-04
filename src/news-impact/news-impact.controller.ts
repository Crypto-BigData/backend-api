import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { NewsImpactService } from './news-impact.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NewsImpactQueryDto, NewsImpactLimitQueryDto, PriceImpactQueryDto } from './dto/news-impact-query.dto';
import { 
  NewsMarkerDto, 
  PriceImpactDto, 
  ImpactTableRowDto, 
  SentimentCorrelationDto 
} from './dto/news-impact-response.dto';

@ApiTags('News Impact')
@Controller('news-impact')
@UseInterceptors(CacheInterceptor)
export class NewsImpactController {
  constructor(private readonly newsImpactService: NewsImpactService) {}

  @Get('markers')
  @ApiOperation({ summary: 'Get news markers with price at publish time for charting' })
  @ApiResponse({ status: 200, description: 'List of news markers', type: [NewsMarkerDto] })
  @CacheTTL(30000) // 30s — data thay đổi khi có tin mới
  async getNewsMarkers(@Query() query: NewsImpactLimitQueryDto) {
    const now = Date.now();
    const from = query.fromTime ? Number(query.fromTime) : now - 7 * 24 * 60 * 60 * 1000;
    const to = query.toTime ? Number(query.toTime) : now;

    return this.newsImpactService.getNewsMarkers(
      query.ticker?.toUpperCase() ?? 'BTCUSDT',
      from,
      to,
      Number(query.limit ?? '50'),
    );
  }

  @Get('price-impact/:id')
  @ApiOperation({ summary: 'Get detailed price impact (5m, 15m, 1h, 4h) for a specific news item' })
  @ApiResponse({ status: 200, description: 'Price impact details', type: PriceImpactDto })
  @CacheTTL(60000) // 60s — tin mới cần data fresh
  async getPriceImpact(
    @Param('id') id: string,
    @Query() query: PriceImpactQueryDto,
  ) {
    return this.newsImpactService.getPriceImpact(
      Number(id),
      query.ticker?.toUpperCase() ?? 'BTCUSDT',
    );
  }

  @Get('impact-table')
  @ApiOperation({ summary: 'Get batch impact data for news table (15m and 1h impacts)' })
  @ApiResponse({ status: 200, description: 'Array of impact table rows', type: [ImpactTableRowDto] })
  @CacheTTL(60000) // 60s
  async getImpactTable(@Query() query: NewsImpactLimitQueryDto) {
    const now = Date.now();
    const from = query.fromTime ? Number(query.fromTime) : now - 7 * 24 * 60 * 60 * 1000;
    const to = query.toTime ? Number(query.toTime) : now;

    return this.newsImpactService.getImpactTable(
      query.ticker?.toUpperCase() ?? 'BTCUSDT',
      from,
      to,
      Number(query.limit ?? '50'),
    );
  }

  @Get('sentiment-correlation')
  @ApiOperation({ summary: 'Get average price impact aggregated by sentiment' })
  @ApiResponse({ status: 200, description: 'Sentiment correlation data', type: [SentimentCorrelationDto] })
  @CacheTTL(120000) // 120s — aggregate nặng, cache lâu hơn
  async getSentimentCorrelation(@Query() query: NewsImpactQueryDto) {
    const now = Date.now();
    const from = query.fromTime ? Number(query.fromTime) : now - 30 * 24 * 60 * 60 * 1000;
    const to = query.toTime ? Number(query.toTime) : now;

    return this.newsImpactService.getSentimentCorrelation(
      query.ticker?.toUpperCase() ?? 'BTCUSDT',
      from,
      to,
    );
  }
}
