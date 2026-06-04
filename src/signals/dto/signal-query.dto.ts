import { ApiPropertyOptional } from '@nestjs/swagger';

export class SignalQueryDto {
  @ApiPropertyOptional({
    description: 'Max active signals to return',
    example: '10',
    default: '10',
  })
  limit?: string = '10';
}
