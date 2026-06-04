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
