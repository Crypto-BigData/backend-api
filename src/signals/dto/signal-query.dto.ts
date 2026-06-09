import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SignalQueryDto {
  @ApiPropertyOptional({
    description: 'Max active signals to return',
    example: '10',
    default: '10',
  })
  @IsOptional()
  @IsString()
  limit?: string = '10';

  @ApiPropertyOptional({
    description: 'Filter by ticker symbol',
    example: 'BTCUSDT',
  })
  @IsOptional()
  @IsString()
  ticker?: string;
}
