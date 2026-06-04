import { ApiProperty } from '@nestjs/swagger';

export class SignalDto {
  @ApiProperty({ example: 'sig-123' })
  id: string;

  @ApiProperty({ example: 'BTCUSDT' })
  ticker: string;

  @ApiProperty({ example: 'PUMP', description: 'PUMP | DUMP | VOLATILITY_SPIKE' })
  type: string;

  @ApiProperty({ example: 0.95 })
  confidence: number;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  detectedAt: Date;

  @ApiProperty({ example: { volumeIncrease: '300%' } })
  metadata: Record<string, unknown>;
}

export class SignalListResponseDto {
  @ApiProperty({ type: [SignalDto] })
  data: SignalDto[];
}
