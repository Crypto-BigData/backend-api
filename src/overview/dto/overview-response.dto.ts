import { ApiProperty } from '@nestjs/swagger';

class SentimentBreakdownDto {
  @ApiProperty({ example: 45 })
  positive: number;

  @ApiProperty({ example: 35 })
  neutral: number;

  @ApiProperty({ example: 20 })
  negative: number;
}

export class MarketSummaryDto {
  @ApiProperty({ example: '65432.12' })
  btcPrice: string;

  @ApiProperty({ example: '2.5' })
  btcChange24h: string;

  @ApiProperty({ example: '3456.78' })
  ethPrice: string;

  @ApiProperty({ example: '-1.2' })
  ethChange24h: string;

  @ApiProperty({ type: SentimentBreakdownDto })
  generalSentiment: SentimentBreakdownDto;
}

export class TopMoverDto {
  @ApiProperty({ example: 'SOLUSDT' })
  ticker: string;

  @ApiProperty({ example: '145.2' })
  lastPrice: string;

  @ApiProperty({ example: '15.4' })
  priceChangePercent24h: string;

  @ApiProperty({ example: 'gainer', description: 'gainer | loser' })
  type: string;
}

export class VolumeSpikeDto {
  @ApiProperty({ example: 'DOGEUSDT' })
  ticker: string;

  @ApiProperty({ example: '1500000.00' })
  lastVolume24h: string;

  @ApiProperty({ example: '500000.00' })
  averageVolume7d: string;

  @ApiProperty({ example: '3.0' })
  spikeRatio: string;
}

export class TopMoverListResponseDto {
  @ApiProperty({ type: [TopMoverDto] })
  data: TopMoverDto[];
}

export class VolumeSpikeListResponseDto {
  @ApiProperty({ type: [VolumeSpikeDto] })
  data: VolumeSpikeDto[];
}
