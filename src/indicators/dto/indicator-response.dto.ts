import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class MAPointDto {
  @ApiProperty({ example: 1700292900000 })
  openTime: number;

  @ApiProperty({ example: '65432.12' })
  value: string;
}

class RSIPointDto {
  @ApiProperty({ example: 1700292900000 })
  openTime: number;

  @ApiProperty({ example: '55.2' })
  value: string;
}

class BollingerPointDto {
  @ApiProperty({ example: 1700292900000 })
  openTime: number;

  @ApiProperty({ example: '66000.00' })
  upper: string;

  @ApiProperty({ example: '65000.00' })
  middle: string;

  @ApiProperty({ example: '64000.00' })
  lower: string;
}

export class IndicatorResponseDto {
  @ApiProperty({ example: 'BTCUSDT' })
  ticker: string;

  @ApiProperty({ example: 300000 })
  interval: number;

  @ApiPropertyOptional({ type: [MAPointDto] })
  ma20?: MAPointDto[];

  @ApiPropertyOptional({ type: [MAPointDto] })
  ma50?: MAPointDto[];

  @ApiPropertyOptional({ type: [MAPointDto] })
  ema20?: MAPointDto[];

  @ApiPropertyOptional({ type: [MAPointDto] })
  ema50?: MAPointDto[];

  @ApiPropertyOptional({ type: [RSIPointDto] })
  rsi?: RSIPointDto[];

  @ApiPropertyOptional({ type: [BollingerPointDto] })
  bollinger?: BollingerPointDto[];
}
