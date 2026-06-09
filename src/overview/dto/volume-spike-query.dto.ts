import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class VolumeSpikeQueryDto {
  @ApiPropertyOptional({
    description: 'Volume spike ratio threshold (e.g., 2.0 = 200% of avg volume)',
    example: '2.0',
    default: '2.0',
  })
  @IsOptional()
  @IsString()
  threshold?: string = '2.0';

  @ApiPropertyOptional({
    description: 'Max number of spikes to return',
    example: '10',
    default: '10',
  })
  @IsOptional()
  @IsString()
  limit?: string = '10';
}
