import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { NewsImpactService } from './news-impact.service';
import { NewsMarker, PriceImpact, ImpactTableRow, SentimentCorrelation } from './interfaces/news-impact-result.interface';

@Controller('news-impact')
@UseInterceptors(CacheInterceptor)
export class NewsImpactController {
  constructor(private readonly newsImpactService: NewsImpactService) {}

  @Get('markers')
  @CacheTTL(30000) // 30s — data thay đổi khi có tin mới
  async getNewsMarkers(
    @Query('ticker') ticker: string = 'BTCUSDT',
    @Query('fromTime') fromTime?: string,
    @Query('toTime') toTime?: string,
    @Query('limit') limit: string = '50',
  ): Promise<NewsMarker[]> {
    const now = Date.now();
    const from = fromTime ? Number(fromTime) : now - 7 * 24 * 60 * 60 * 1000;
    const to = toTime ? Number(toTime) : now;

    return this.newsImpactService.getNewsMarkers(
      ticker.toUpperCase(),
      from,
      to,
      Number(limit) || 50,
    );
  }

  @Get('price-impact/:id')
  @CacheTTL(60000) // 60s — tin mới cần data fresh
  async getPriceImpact(
    @Param('id') id: string,
    @Query('ticker') ticker: string = 'BTCUSDT',
  ): Promise<PriceImpact> {
    return this.newsImpactService.getPriceImpact(
      Number(id),
      ticker.toUpperCase(),
    );
  }

  @Get('impact-table')
  @CacheTTL(60000) // 60s
  async getImpactTable(
    @Query('ticker') ticker: string = 'BTCUSDT',
    @Query('fromTime') fromTime?: string,
    @Query('toTime') toTime?: string,
    @Query('limit') limit: string = '50',
  ): Promise<ImpactTableRow[]> {
    const now = Date.now();
    const from = fromTime ? Number(fromTime) : now - 7 * 24 * 60 * 60 * 1000;
    const to = toTime ? Number(toTime) : now;

    return this.newsImpactService.getImpactTable(
      ticker.toUpperCase(),
      from,
      to,
      Number(limit) || 50,
    );
  }

  @Get('sentiment-correlation')
  @CacheTTL(120000) // 120s — aggregate nặng, cache lâu hơn
  async getSentimentCorrelation(
    @Query('ticker') ticker: string = 'BTCUSDT',
    @Query('fromTime') fromTime?: string,
    @Query('toTime') toTime?: string,
  ): Promise<SentimentCorrelation[]> {
    const now = Date.now();
    const from = fromTime ? Number(fromTime) : now - 30 * 24 * 60 * 60 * 1000;
    const to = toTime ? Number(toTime) : now;

    return this.newsImpactService.getSentimentCorrelation(
      ticker.toUpperCase(),
      from,
      to,
    );
  }
}
