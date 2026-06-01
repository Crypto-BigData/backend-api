export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

export interface MarketSummary {
  btcPrice: string;
  btcChange24h: string;
  ethPrice: string;
  ethChange24h: string;
  generalSentiment: SentimentBreakdown;
}
