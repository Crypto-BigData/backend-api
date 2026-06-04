import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NewsMarkerDto {
  @ApiProperty({ example: 123 })
  newsId: number;

  @ApiProperty({ example: 'Bitcoin surges' })
  title: string;

  @ApiProperty({ example: 'Market Desk' })
  sourceName: string;

  @ApiProperty({ example: 'positive' })
  sentiment: string;

  @ApiProperty({ example: 'bitcoin, surge' })
  keywords: string;

  @ApiProperty({ example: 1700292900000 })
  publishedOn: number;

  @ApiPropertyOptional({ type: String, nullable: true, example: '65000.00' })
  priceAtPublish: string | null;

  @ApiProperty({ example: 'BTCUSDT' })
  ticker: string;
}

export class PriceImpactWindowDto {
  @ApiProperty({ example: '66000.00' })
  price: string;

  @ApiProperty({ example: '1.5384' })
  changePercent: string;
}

class PriceImpactDetailsDto {
  @ApiPropertyOptional({ type: () => PriceImpactWindowDto, nullable: true })
  after5m: PriceImpactWindowDto | null;

  @ApiPropertyOptional({ type: () => PriceImpactWindowDto, nullable: true })
  after15m: PriceImpactWindowDto | null;

  @ApiPropertyOptional({ type: () => PriceImpactWindowDto, nullable: true })
  after1h: PriceImpactWindowDto | null;

  @ApiPropertyOptional({ type: () => PriceImpactWindowDto, nullable: true })
  after4h: PriceImpactWindowDto | null;
}

export class PriceImpactDto {
  @ApiProperty({ example: 123 })
  newsId: number;

  @ApiProperty({ example: 'Bitcoin surges' })
  title: string;

  @ApiProperty({ example: 'positive' })
  sentiment: string;

  @ApiProperty({ example: 1700292900000 })
  publishedOn: number;

  @ApiProperty({ example: 'BTCUSDT' })
  ticker: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: '65000.00' })
  priceAtPublish: string | null;

  @ApiProperty({ type: PriceImpactDetailsDto })
  impact: PriceImpactDetailsDto;
}

export class ImpactTableRowDto {
  @ApiProperty({ example: 123 })
  newsId: number;

  @ApiProperty({ example: 'Bitcoin surges' })
  title: string;

  @ApiProperty({ example: 'positive' })
  sentiment: string;

  @ApiProperty({ example: 'BTCUSDT' })
  ticker: string;

  @ApiProperty({ example: 1700292900000 })
  publishedOn: number;

  @ApiProperty({ type: String, nullable: true, example: '1.5384' })
  changePercent15m: string | null;

  @ApiProperty({ type: String, nullable: true, example: '2.1054' })
  changePercent1h: string | null;
}

export class SentimentCorrelationDto {
  @ApiProperty({ example: 'positive' })
  sentiment: string;

  @ApiProperty({ example: 45 })
  newsCount: number;

  @ApiProperty({ example: '1.2000' })
  avgChangePercent15m: string;

  @ApiProperty({ example: '2.5000' })
  avgChangePercent1h: string;

  @ApiProperty({ example: '4.8000' })
  avgChangePercent4h: string;
}

// Wrapper responses
export class NewsMarkerListResponseDto {
  @ApiProperty({ type: [NewsMarkerDto] })
  data: NewsMarkerDto[];
}

export class ImpactTableListResponseDto {
  @ApiProperty({ type: [ImpactTableRowDto] })
  data: ImpactTableRowDto[];
}

export class SentimentCorrelationListResponseDto {
  @ApiProperty({ type: [SentimentCorrelationDto] })
  data: SentimentCorrelationDto[];
}
