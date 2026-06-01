export interface TopMover {
  ticker: string;
  lastPrice: string;
  priceChangePercent24h: string;
  type: 'gainer' | 'loser';
}
