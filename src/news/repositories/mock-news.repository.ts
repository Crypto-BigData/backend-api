import { Injectable } from '@nestjs/common';
import { INewsRepository, NewsPaginatedResult } from '../interfaces/news-repository.interface';
import { NewsItem } from '../interfaces/news-item.interface';

/**
 * Mock news data cho development.
 *
 * publishedOn = epoch SECONDS (khớp schema ClickHouse).
 * sentiment = string ("positive" / "negative" / "neutral").
 */
@Injectable()
export class MockNewsRepository implements INewsRepository {
  private readonly mockData: NewsItem[] = [
    {
      id: 1,
      type: 'article',
      guid: 'coindesk-btc-rally-2026',
      url: 'https://www.coindesk.com/markets/btc-rally-2026',
      publishedOn: Math.floor(Date.now() / 1000) - 60 * 30, // 30 phút trước
      imageUrl: 'https://images.coindesk.com/btc-rally.jpg',
      title: 'Bitcoin Surges Past Key Resistance Level',
      subtitle: 'BTC has broken through the $65,000 resistance level.',
      authors: 'Crypto Analyst',
      sourceId: 'coindesk',
      rawBody: 'Bitcoin has broken through the $65,000 resistance level, sparking a new rally in the crypto market. Analysts are calling this a major bullish signal.',
      keywords: 'bitcoin,btc,rally,resistance,bullish',
      sentiment: 'positive',
      sourceName: 'CoinDesk',
      categories: 'Markets|Bitcoin',
      htmlBody: '<p>Bitcoin has broken through the $65,000 resistance level...</p>',
    },
    {
      id: 2,
      type: 'article',
      guid: 'coindesk-stablecoin-regs',
      url: 'https://www.coindesk.com/policy/stablecoin-regulations',
      publishedOn: Math.floor(Date.now() / 1000) - 60 * 60 * 2, // 2 giờ trước
      imageUrl: 'https://images.coindesk.com/regulations.jpg',
      title: 'New Regulations Announced for Stablecoins',
      subtitle: 'Regulators have introduced new compliance requirements.',
      authors: 'Policy Reporter',
      sourceId: 'coindesk',
      rawBody: 'Regulators have introduced new compliance requirements for stablecoin issuers globally, aiming to increase transparency and consumer protection.',
      keywords: 'stablecoin,regulation,compliance,usdt,usdc',
      sentiment: 'negative',
      sourceName: 'CoinDesk',
      categories: 'Policy|Regulation',
      htmlBody: '<p>Regulators have introduced new compliance requirements...</p>',
    },
    {
      id: 3,
      type: 'article',
      guid: 'coindesk-eth-upgrade',
      url: 'https://www.coindesk.com/tech/ethereum-network-upgrade',
      publishedOn: Math.floor(Date.now() / 1000) - 60 * 60 * 5, // 5 giờ trước
      imageUrl: 'https://images.coindesk.com/eth-upgrade.jpg',
      title: 'Ethereum Upgrades Network Successfully',
      subtitle: 'Gas fees reduced significantly after latest upgrade.',
      authors: 'Tech Writer',
      sourceId: 'coindesk',
      rawBody: 'The latest Ethereum network upgrade has been deployed with significantly reduced gas fees and improved transaction throughput.',
      keywords: 'ethereum,eth,upgrade,gas,network',
      sentiment: 'positive',
      sourceName: 'CoinDesk',
      categories: 'Technology|Ethereum',
      htmlBody: '<p>The latest Ethereum network upgrade has been deployed...</p>',
    },
  ];

  async getNews(
    fromTime: number,
    toTime: number,
    page: number,
    pageSize: number,
  ): Promise<NewsPaginatedResult> {
    // Filter theo time range (fromTime/toTime là ms, publishedOn là seconds)
    const fromSec = Math.floor(fromTime / 1000);
    const toSec = Math.floor(toTime / 1000);
    const filtered = this.mockData.filter(
      (n) => n.publishedOn >= fromSec && n.publishedOn <= toSec,
    );

    const offset = (page - 1) * pageSize;
    return {
      data: filtered.slice(offset, offset + pageSize),
      total: filtered.length,
    };
  }

  async getNewsLimit(
    fromTime: number,
    toTime: number,
    limit: number,
  ): Promise<NewsItem[]> {
    const fromSec = Math.floor(fromTime / 1000);
    const toSec = Math.floor(toTime / 1000);
    const filtered = this.mockData.filter(
      (n) => n.publishedOn >= fromSec && n.publishedOn <= toSec,
    );
    return filtered.slice(0, limit);
  }
}
