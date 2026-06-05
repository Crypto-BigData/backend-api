import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({
    description: 'User message in natural language (Vietnamese or English)',
    example: 'BTC giá bao nhiêu?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
