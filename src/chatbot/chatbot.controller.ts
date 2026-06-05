import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  @ApiOperation({
    summary: 'Send a message to the AI chatbot',
    description:
      'Accepts a natural language message and returns an AI-generated response. ' +
      'The chatbot uses OpenAI Function Calling to query internal APIs for real market data.',
  })
  @ApiResponse({ status: 200, description: 'AI reply', type: ChatResponseDto })
  @ApiResponse({ status: 503, description: 'Chatbot unavailable (OPENAI_API_KEY not configured)' })
  async chat(@Body() dto: ChatMessageDto): Promise<ChatResponseDto> {
    const reply = await this.chatbotService.chat(dto.message);
    return { reply };
  }
}
