import { ApiProperty } from '@nestjs/swagger';

export class ChatResponseDto {
  @ApiProperty({
    description: 'AI-generated reply based on internal API data',
    example: 'BTC hiện đang giao dịch ở mức $68,200, tăng 2.3% trong 24h qua.',
  })
  reply: string;
}
