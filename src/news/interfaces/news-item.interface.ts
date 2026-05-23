export interface NewsItem {
  id: string;
  title: string;
  snippet: string;
  source: string;
  url: string;
  sentimentScore: number;
  publishedAt: Date;
  relatedEntities: string[];
}
