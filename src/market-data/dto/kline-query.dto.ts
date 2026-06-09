import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class KlineQueryDto {
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

  @ApiPropertyOptional({
    description: 'Candle interval in milliseconds (e.g. 5m = 300000)',
    example: '300000',
    default: '300000',
  })
  @IsOptional()
  @IsString()
  interval?: string = '300000';
}
