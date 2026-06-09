import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class NewsImpactQueryDto {
  @ApiPropertyOptional({
    description: 'Trading pair ticker',
    example: 'BTCUSDT',
    default: 'BTCUSDT',
  })
  @IsOptional()
  @IsString()
  ticker?: string = 'BTCUSDT';

  @ApiPropertyOptional({
    description: 'Start time in epoch milliseconds',
    example: '1700292900000',
  })
  @IsOptional()
  @IsString()
  fromTime?: string;

  @ApiPropertyOptional({
    description: 'End time in epoch milliseconds',
    example: '1700379300000',
  })
  @IsOptional()
  @IsString()
  toTime?: string;
}

export class NewsImpactLimitQueryDto extends NewsImpactQueryDto {
  @ApiPropertyOptional({
    description: 'Max items to return',
    example: '50',
    default: '50',
  })
  @IsOptional()
  @IsString()
  limit?: string = '50';
}

export class PriceImpactQueryDto {
  @ApiPropertyOptional({
    description: 'Trading pair ticker',
    example: 'BTCUSDT',
    default: 'BTCUSDT',
  })
  @IsOptional()
  @IsString()
  ticker?: string = 'BTCUSDT';
}
