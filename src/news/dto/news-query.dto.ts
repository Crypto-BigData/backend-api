import { ApiPropertyOptional } from '@nestjs/swagger';

export class NewsQueryDto {
  @ApiPropertyOptional({
    description: 'Start time in epoch milliseconds',
    example: '1700292900000',
  })
  fromTime?: string;

  @ApiPropertyOptional({
    description: 'End time in epoch milliseconds',
    example: '1700379300000',
  })
  toTime?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: '1',
    default: '1',
  })
  page?: string = '1';

  @ApiPropertyOptional({
    description: 'Items per page',
    example: '20',
    default: '20',
  })
  pageSize?: string = '20';

  @ApiPropertyOptional({
    description: 'Filter by sentiment (e.g., positive, negative, neutral)',
    example: 'positive',
  })
  sentiment?: string;

  @ApiPropertyOptional({
    description: 'Filter by category (e.g., Bitcoin, DeFi)',
    example: 'Bitcoin',
  })
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by source name (e.g., CoinDesk)',
    example: 'CoinDesk',
  })
  source?: string;
}

export class NewsLimitQueryDto {
  @ApiPropertyOptional({
    description: 'Start time in epoch milliseconds',
    example: '1700292900000',
  })
  fromTime?: string;

  @ApiPropertyOptional({
    description: 'End time in epoch milliseconds',
    example: '1700379300000',
  })
  toTime?: string;

  @ApiPropertyOptional({
    description: 'Max items to return',
    example: '10',
    default: '10',
  })
  limit?: string = '10';
}
