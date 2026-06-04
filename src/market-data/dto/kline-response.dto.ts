import { ApiProperty } from '@nestjs/swagger';

export class KlineDto {
  @ApiProperty({ example: 'BTCUSDT' })
  ticker: string;

  @ApiProperty({ example: 1700292900000, description: 'Epoch ms' })
  openTime: number;

  @ApiProperty({ example: '65432.12', type: String })
  open: string;

  @ApiProperty({ example: '65500.00', type: String })
  high: string;

  @ApiProperty({ example: '65400.00', type: String })
  low: string;

  @ApiProperty({ example: '65480.50', type: String })
  close: string;

  @ApiProperty({ example: '120.5', type: String })
  volume: string;

  @ApiProperty({ example: 1700293199999, description: 'Epoch ms' })
  closeTime: number;

  @ApiProperty({ example: '7894561.20', type: String })
  quoteAssetVolume: string;

  @ApiProperty({ example: 1250 })
  numOfTrades: number;

  @ApiProperty({ example: '60.2', type: String })
  takerBuyBaseAssetVolume: string;

  @ApiProperty({ example: '3941000.5', type: String })
  takerBuyQuoteAssetVolume: string;
}

export class KlineResponseDto {
  @ApiProperty({ type: [KlineDto] })
  data: KlineDto[];
}
