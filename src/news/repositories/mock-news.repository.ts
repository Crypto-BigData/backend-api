import { Injectable } from '@nestjs/common';
import { INewsRepository } from '../interfaces/news-repository.interface';
import { NewsItem } from '../interfaces/news-item.interface';

@Injectable()
export class MockNewsRepository implements INewsRepository {
  async getLatestNews(limit: number): Promise<NewsItem[]> {
    const mockData: NewsItem[] = [
      {
        id: 'news-1',
        title: 'Bitcoin Surges Past Key Resistance Level',
        snippet: 'BTC has broken through the $65,000 resistance level, sparking a new rally in the crypto market.',
        source: 'CryptoNews',
        url: 'https://example.com/news/1',
        sentimentScore: 0.8,
        publishedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        relatedEntities: ['BTC'],
      },
      {
        id: 'news-2',
        title: 'New Regulations Announced for Stablecoins',
        snippet: 'Regulators have introduced new compliance requirements for stablecoin issuers globally.',
        source: 'FinTechDaily',
        url: 'https://example.com/news/2',
        sentimentScore: -0.2,
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        relatedEntities: ['USDT', 'USDC'],
      },
      {
        id: 'news-3',
        title: 'Ethereum Upgrades Network Successfully',
        snippet: 'The latest Ethereum network upgrade has been deployed with significantly reduced gas fees.',
        source: 'CoinTelegraph',
        url: 'https://example.com/news/3',
        sentimentScore: 0.9,
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        relatedEntities: ['ETH'],
      },
    ];

    return mockData.slice(0, limit);
  }
}
