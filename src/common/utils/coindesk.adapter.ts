/**
 * Adapter gọi CoinDesk News API.
 */

const COINDESK_BASE_URL = 'https://data-api.coindesk.com';

export interface CoinDeskNewsItem {
  id: number;
  type: string;
  guid: string;
  url: string;
  publishedOn: number;
  imageUrl: string;
  title: string;
  subtitle: string; // Đã fix tên biến subTittle -> subtitle
  authors: string;
  sourceId: string;
  rawBody: string;
  keywords: string;
  sentiment: string;
  sourceName: string;
  categories: string; // Sẽ lưu dưới dạng JSON String
}

export class CoinDeskAdapter {
  private keyIndex = 0;
  private readonly apiKeys: string[];

  constructor(keysConfig: string) {
    // Nếu có key, parse thành mảng. Loại bỏ khoảng trắng thừa.
    this.apiKeys = keysConfig
      ? keysConfig.split(',').map((k) => k.trim()).filter(Boolean)
      : [];
  }

  hasKeys(): boolean {
    return this.apiKeys.length > 0;
  }

  private getNextApiKey(): string {
    if (this.apiKeys.length === 0) {
      throw new Error('CoinDesk API Keys are not configured');
    }
    const key = this.apiKeys[this.keyIndex];
    this.keyIndex = (this.keyIndex + 1) % this.apiKeys.length;
    return key;
  }

  /**
   * Fetch tin tức từ CoinDesk API.
   * @param toTime Thời điểm giới hạn (epoch seconds). Fetch các bài đăng <= toTime
   * @param limit Số lượng tối đa (API CoinDesk cho max 100)
   */
  async fetchNews(toTime: number, limit: number = 100): Promise<CoinDeskNewsItem[]> {
    if (!this.hasKeys()) return [];

    const params = new URLSearchParams({
      lang: 'EN',
      limit: String(limit),
      to_ts: String(toTime),
      api_key: this.getNextApiKey(),
    });

    const res = await fetch(`${COINDESK_BASE_URL}/news/v1/article/list?${params.toString()}`);

    if (!res.ok) {
      throw new Error(`CoinDesk fetchNews failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (!data || !data.Data || !Array.isArray(data.Data)) {
      return [];
    }

    return data.Data.map((item: any) => ({
      id: Number(item.ID),
      type: item.TYPE,
      guid: item.GUID,
      url: item.URL,
      publishedOn: Number(item.PUBLISHED_ON),
      imageUrl: item.IMAGE_URL,
      title: item.TITLE,
      subtitle: item.SUBTITLE,
      authors: item.AUTHORS,
      sourceId: item.SOURCE_ID,
      rawBody: item.BODY,
      keywords: item.KEYWORDS,
      sentiment: item.SENTIMENT,
      sourceName: item.SOURCE_DATA?.NAME || '',
      categories: JSON.stringify((item.CATEGORY_DATA || []).map((c: any) => c.CATEGORY)),
    }));
  }
}
