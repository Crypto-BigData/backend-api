import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ClickHouseClient } from '@clickhouse/client';
import { CLICKHOUSE_CLIENT } from '../config/clickhouse.module';
import { CoinDeskNewsItem } from '../common/utils/coindesk.adapter';

@Injectable()
export class WorkerNewsService {
  private readonly logger = new Logger(WorkerNewsService.name);

  constructor(
    @Inject(CLICKHOUSE_CLIENT)
    private readonly clickhouse: ClickHouseClient,
  ) {}

  /**
   * Batch insert news vào bảng news.
   * CoinDesk API trả tối đa 100 bài mỗi request, nên batch size nhỏ, không cần chia nhỏ thêm.
   * Bảng dùng ReplacingMergeTree, tự động dedup dữ liệu trùng (cùng id và publishedOn).
   */
  async handleSaveNews(newsList: CoinDeskNewsItem[]): Promise<void> {
    if (newsList.length === 0) return;

    // Lọc bỏ những bài viết không hợp lệ (không có id hoặc publishedOn)
    const validNews = newsList.filter((n) => n.id && n.publishedOn);

    if (validNews.length === 0) return;

    await this.clickhouse.insert({
      table: 'news',
      values: validNews,
      format: 'JSONEachRow',
    });

    this.logger.log(`Inserted ${validNews.length} news items into ClickHouse`);
  }
}
