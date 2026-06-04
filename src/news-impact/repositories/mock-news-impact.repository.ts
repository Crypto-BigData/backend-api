import { Injectable } from '@nestjs/common';
import { INewsImpactRepository } from '../interfaces/news-impact-repository.interface';
import { NewsMarker, PriceImpact, ImpactTableRow, SentimentCorrelation } from '../interfaces/news-impact-result.interface';

@Injectable()
export class MockNewsImpactRepository implements INewsImpactRepository {
  async getNewsMarkers(
    ticker: string,
    _fromTime: number,
    _toTime: number,
    _limit: number,
  ): Promise<NewsMarker[]> {
    const now = Date.now();
    return [
      {
        newsId: 1001,
        title: 'Bitcoin ETF Approval Expected This Month',
        sourceName: 'CoinDesk',
        sentiment: 'positive',
        keywords: 'Bitcoin|ETF|SEC',
        publishedOn: now - 2 * 60 * 60 * 1000,
        priceAtPublish: '68500.123456789012345678',
        ticker,
      },
      {
        newsId: 1002,
        title: 'Major Exchange Reports Security Breach',
        sourceName: 'CoinTelegraph',
        sentiment: 'negative',
        keywords: 'Exchange|Hack|Security',
        publishedOn: now - 6 * 60 * 60 * 1000,
        priceAtPublish: '67200.987654321012345678',
        ticker,
      },
      {
        newsId: 1003,
        title: 'Federal Reserve Holds Interest Rates Steady',
        sourceName: 'CryptoNews',
        sentiment: 'neutral',
        keywords: 'Fed|Interest Rate|Macro',
        publishedOn: now - 12 * 60 * 60 * 1000,
        priceAtPublish: '67800.555555555555555555',
        ticker,
      },
    ];
  }

  async getPriceImpact(
    newsId: number,
    ticker: string,
  ): Promise<PriceImpact | null> {
    // Sentinel: newsId=9999 returns null for FE testing of 404 flow
    if (newsId <= 0 || newsId === 9999) return null;

    return {
      newsId,
      title: 'Bitcoin ETF Approval Expected This Month',
      sentiment: 'positive',
      publishedOn: Date.now() - 2 * 60 * 60 * 1000,
      ticker,
      priceAtPublish: '68500.123456789012345678',
      impact: {
        after5m: { price: '68550.200000000000000000', changePercent: '0.0731' },
        after15m: { price: '68700.500000000000000000', changePercent: '0.2927' },
        after1h: { price: '69100.800000000000000000', changePercent: '0.8773' },
        after4h: { price: '69500.100000000000000000', changePercent: '1.4600' },
      },
    };
  }

  async getImpactTable(
    ticker: string,
    _fromTime: number,
    _toTime: number,
    _limit: number,
  ): Promise<ImpactTableRow[]> {
    const now = Date.now();
    return [
      {
        newsId: 1001,
        title: 'Bitcoin ETF Approval Expected This Month',
        sentiment: 'positive',
        ticker,
        publishedOn: now - 2 * 60 * 60 * 1000,
        changePercent15m: '0.2927',
        changePercent1h: '0.8773',
      },
      {
        newsId: 1002,
        title: 'Major Exchange Reports Security Breach',
        sentiment: 'negative',
        ticker,
        publishedOn: now - 6 * 60 * 60 * 1000,
        changePercent15m: '-0.5120',
        changePercent1h: '-1.2340',
      },
      {
        newsId: 1003,
        title: 'Federal Reserve Holds Interest Rates Steady',
        sentiment: 'neutral',
        ticker,
        publishedOn: now - 12 * 60 * 60 * 1000,
        changePercent15m: '0.0500',
        changePercent1h: null,
      },
    ];
  }

  async getSentimentCorrelation(
    _ticker: string,
    _fromTime: number,
    _toTime: number,
  ): Promise<SentimentCorrelation[]> {
    return [
      {
        sentiment: 'positive',
        newsCount: 45,
        avgChangePercent15m: '0.3200',
        avgChangePercent1h: '0.8500',
        avgChangePercent4h: '1.2100',
      },
      {
        sentiment: 'negative',
        newsCount: 22,
        avgChangePercent15m: '-0.4100',
        avgChangePercent1h: '-1.0300',
        avgChangePercent4h: '-1.5600',
      },
      {
        sentiment: 'neutral',
        newsCount: 18,
        avgChangePercent15m: '0.0200',
        avgChangePercent1h: '0.0800',
        avgChangePercent4h: '0.1500',
      },
    ];
  }
}
