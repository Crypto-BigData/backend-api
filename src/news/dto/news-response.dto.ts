import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NewsItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'article' })
  type: string;

  @ApiProperty({ example: 'https://coindesk.com/article/1' })
  guid: string;

  @ApiProperty({ example: 'https://coindesk.com/article/1' })
  url: string;

  @ApiProperty({ example: 1700292900, description: 'Epoch seconds' })
  publishedOn: number;

  @ApiProperty({ example: 'https://image.url/1.png' })
  imageUrl: string;

  @ApiProperty({ example: 'Bitcoin breaks $60k' })
  title: string;

  @ApiProperty({ example: 'A new high for the year' })
  subtitle: string;

  @ApiProperty({ example: 'John Doe' })
  authors: string;

  @ApiProperty({ example: 'coindesk' })
  sourceId: string;

  @ApiProperty({ example: 'Market Desk' })
  sourceName: string;

  @ApiProperty({ example: 'Market, Bitcoin' })
  keywords: string;

  @ApiProperty({ example: '["Markets", "Business"]', description: 'JSON stringified array' })
  categories: string;

  @ApiPropertyOptional({ example: 'positive', description: 'positive | negative | neutral' })
  sentiment?: string;

  @ApiProperty({ example: 'Bitcoin breaks $60k today...' })
  rawBody: string;
}

export class NewsPaginatedResponseDto {
  @ApiProperty({ type: [NewsItemDto] })
  data: NewsItemDto[];

  @ApiProperty({ example: 150 })
  total: number;
}

export class NewsListResponseDto {
  @ApiProperty({ type: [NewsItemDto] })
  data: NewsItemDto[];
}
