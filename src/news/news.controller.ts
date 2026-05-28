import { Controller, Get, Query } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get('latest')
  async getLatestNews(@Query('limit') limit: number = 10) {
    return this.newsService.getLatestNews(Number(limit));
  }
}
