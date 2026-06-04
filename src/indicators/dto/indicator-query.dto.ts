import { ApiPropertyOptional } from '@nestjs/swagger';

export class IndicatorQueryDto {
  @ApiPropertyOptional({
    description: 'Trading pair ticker',
    example: 'BTCUSDT',
    default: 'BTCUSDT',
  })
  ticker?: string = 'BTCUSDT';

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
    description: 'Candle interval in milliseconds (e.g. 5m = 300000)',
    example: '300000',
    default: '300000',
  })
  interval?: string = '300000';

  @ApiPropertyOptional({
    description: 'Comma separated list of indicators (ma, ema, rsi, bb)',
    example: 'ma,rsi,bb',
    default: 'ma',
  })
  indicators?: string = 'ma';
}
