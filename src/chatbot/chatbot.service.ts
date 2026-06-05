import { Injectable, Logger, ServiceUnavailableException, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/**
 * Chatbot service using OpenAI Function Calling.
 *
 * Architecture: Chatbot does NOT access the database directly.
 * Instead, it calls the Internal REST API endpoints (kline, news, time-now)
 * via HTTP to retrieve data, then uses the LLM to generate a response.
 */
@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly openai: OpenAI | null = null;

  private readonly MAX_TOOL_ROUNDS = 5;
  private readonly FALLBACK_MESSAGE =
    'Xin lỗi, tôi không thể xử lý yêu cầu này lúc này. Vui lòng thử lại sau.';

  /** Maps tool name → API path (relative to /api/) */
  private readonly toolEndpoints: Record<string, string> = {
    getKlines: 'kline/klines',
    getNewsLimit: 'news/limit',
    getTimeNow: 'kline/time-now',
  };

  constructor(private readonly config: ConfigService) {
    const port = this.config.get<number>('PORT', 3000);
    this.baseUrl =
      this.config.get<string>('INTERNAL_API_BASE') || `http://localhost:${port}`;
    this.model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');

    const apiKey = this.config.get<string>('OPENAI_API_KEY', '');
    const baseURL = this.config.get<string>('OPENAI_BASE_URL');
    
    if (apiKey) {
      this.openai = new OpenAI({ 
        apiKey,
        ...(baseURL ? { baseURL } : {})
      });
      this.logger.log(`OpenAI client initialized (model: ${this.model})`);
    } else {
      this.logger.warn('OPENAI_API_KEY not configured — chatbot endpoint will return 503');
    }
  }

  async chat(message: string): Promise<string> {
    if (!this.openai) {
      throw new ServiceUnavailableException(
        'Chatbot is not available: OPENAI_API_KEY is not configured',
      );
    }

    const systemPrompt = this.buildSystemPrompt();
    const tools = this.buildToolDefinitions();

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ];

    try {
      // Multi-round tool loop
      for (let round = 0; round < this.MAX_TOOL_ROUNDS; round++) {
        const completion = await this.openai.chat.completions.create({
          model: this.model,
          messages,
          tools,
          tool_choice: 'auto',
        });

        const assistantMessage = completion.choices[0].message;
        messages.push(assistantMessage);

        const toolCalls = assistantMessage.tool_calls;
        if (!toolCalls || toolCalls.length === 0) {
          // LLM returned a text reply — done
          return assistantMessage.content ?? this.FALLBACK_MESSAGE;
        }

        // Execute all tool calls in parallel (filter to function calls only)
        const functionCalls = toolCalls.filter(
          (call): call is OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall =>
            call.type === 'function',
        );

        const toolResults = await Promise.all(
          functionCalls.map(async (call) => {
            const toolName = call.function.name;
            const args = JSON.parse(call.function.arguments);
            this.logger.log(`[DEBUG-TOOL] Tool call [round ${round + 1}]: ${toolName}(${JSON.stringify(args)})`);

            let result = await this.executeTool(toolName, args) as any;

            // Handle TransformInterceptor wrapper
            let dataArray = result;
            if (result && typeof result === 'object' && Array.isArray(result.data)) {
              dataArray = result.data;
            }

            if (Array.isArray(dataArray) && dataArray.length > 30) {
              this.logger.warn(`[DEBUG-TOOL] Tool ${toolName} returned ${dataArray.length} items. Hard capping to 30 to save TPM.`);
              dataArray = dataArray.slice(-30); // Take last 30 items
              
              if (result.data) {
                result.data = dataArray;
              } else {
                result = dataArray;
              }
            }

            // Log response size to debug TPM bottleneck
            const payloadString = JSON.stringify(result);
            this.logger.log(`Tool ${toolName} returned payload of length: ${payloadString.length} chars`);

            return {
              role: 'tool' as const,
              tool_call_id: call.id,
              content: payloadString,
            };
          }),
        );

        messages.push(...toolResults);
      }

      // Exhausted all rounds without a final text reply
      this.logger.warn(`Tool loop exhausted after ${this.MAX_TOOL_ROUNDS} rounds`);
      return this.FALLBACK_MESSAGE;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;

      this.logger.error(`OpenAI API error: ${error.message}`, error.stack);
      throw new BadGatewayException('Failed to communicate with AI service');
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private buildSystemPrompt(): string {
    return `
Bạn là chatbot phân tích dữ liệu crypto.

QUY TẮC BẮT BUỘC:
- CHỈ sử dụng dữ liệu từ API nội bộ
- KHÔNG dự đoán giá tương lai
- KHÔNG khẳng định nguyên nhân tuyệt đối
- Khi nói "tại sao giá giảm", chỉ mô tả dữ liệu quan sát được (correlation)
- Nếu thiếu dữ liệu, phải nói rõ
- Nguyên tắc: 
1. KHÔNG BAO GIỜ nhắc đến tên các công cụ (tools) nội bộ như getKlines, getNewsLimit trong câu trả lời. Giữ bí mật về mặt kỹ thuật.
2. Format các con số tiền tệ rõ ràng, dễ đọc (ví dụ: $62,540.01 thay vì 62540.010000).
3. Xưng "tôi" và gọi người dùng là "bạn", giọng điệu chuyên nghiệp, tự nhiên.
4. Lưu ý: Trường 'volume' là số lượng coin, trường 'quoteAssetVolume' là giá trị USD. Đừng nhầm lẫn đơn vị.
5. Khi người dùng hỏi dữ liệu quá khứ (hôm qua, tuần trước), hãy truyền tham số timeRange tương ứng. Tuyệt đối không tự tính toán ngày giờ.
6. TUYỆT ĐỐI KHÔNG BỊA DATA. Nếu API trả về mảng rỗng hoặc dữ liệu không khớp với ngày tháng bạn cần tìm (vd hỏi 2020 nhưng data trả về 2026), hãy thành thật trả lời là hệ thống không có dữ liệu đó.
7. Nếu tin nhắn của người dùng vô nghĩa (chỉ chứa dấu câu, khoảng trắng, ví dụ: '...', '"""') hoặc không rõ ràng, PHẢI yêu cầu họ đặt câu hỏi cụ thể. TUYỆT ĐỐI KHÔNG tự động gọi hàm.
- Data về giá, ohlcv thì dùng getKlines
- Data về tin tức thì dùng getNewsLimit
- Kết hợp các data để đưa ra câu trả lời tốt nhất

Phong cách:
- Ngắn gọn
- Có số liệu
- Trung lập
- Nếu có time không được trả lời dạng timestamp mà phải là human time

CẤM TUYỆT ĐỐI:
- Nói "hãy đợi", "tôi sẽ kiểm tra", "tôi sẽ cập nhật sau"
- Giả vờ đang xử lý bất đồng bộ
- Giả vờ là con người

NẾU cần dữ liệu:
- PHẢI gọi tool ngay trong cùng lượt
`.trim();
  }

  private buildToolDefinitions(): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return [

      {
        type: 'function',
        function: {
          name: 'getKlines',
          description: `
Lấy dữ liệu giá OHLCV (candlestick) cho một cặp giao dịch trong một khoảng thời gian.

BẮT BUỘC sử dụng khi:
- Câu hỏi liên quan đến giá (giá hiện tại, giá gần đây, giá trong X phút/giờ qua)
- Câu hỏi liên quan đến biến động giá, tăng/giảm, xu hướng ngắn hạn
- Câu hỏi yêu cầu số liệu OHLCV

QUY TẮC:
- KHÔNG sử dụng interval = 60000 (1m)
- Interval hợp lệ: 5m (300000), 15m (900000), 1h (3600000), 4h (14400000), 1d (86400000)
- "Giá hiện tại" = close price của cây nến gần nhất
- Nếu câu hỏi chứa thời gian tương đối (vd: hôm qua, 1 giờ trước) → KHÔNG tự tính toán timestamp. Hãy điền vào trường 'timeRange'.
- Lựa chọn interval phù hợp để có data đủ chi tiết để phân tích
          `.trim(),
          parameters: {
            type: 'object',
            properties: {
              ticker: {
                type: 'string',
                description: 'Cặp giao dịch, ví dụ: BTCUSDT, ETHUSDT',
              },
              timeRange: {
                type: 'string',
                description: 'Khoảng thời gian tương đối (vd: "today", "yesterday", "last_week", "last_month").',
              },
            },
            required: ['ticker'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getNewsLimit',
          description: `
Lấy tin tức crypto trong một khoảng thời gian.

BẮT BUỘC sử dụng khi:
- Câu hỏi nhắc đến "tin tức", "news", "sự kiện", "thông tin gần đây"
- Câu hỏi hỏi "có tin gì liên quan đến giá hay không"

QUY TẮC:
- Limit mặc định: 10–20 bài
- Chỉ dùng tin trong khoảng thời gian được hỏi
- Không suy đoán tác động giá, chỉ mô tả sự xuất hiện của tin
          `.trim(),
          parameters: {
            type: 'object',
            properties: {
              fromTime: {
                type: 'number',
                description: 'Timestamp bắt đầu (epoch milliseconds)',
              },
              toTime: {
                type: 'number',
                description: 'Timestamp kết thúc (epoch milliseconds)',
              },
              limit: {
                type: 'number',
                description: 'Số lượng tin tối đa cần lấy',
              },
            },
            // Groq may fail if we strictly require timestamps the LLM doesn't have yet
            // required: ['fromTime', 'toTime', 'limit'],
          },
        },
      },
    ];
  }

  /**
   * Execute a single tool call by calling the Internal REST API.
   * Returns the API response data, or an error object for the LLM to interpret.
   */
  private async executeTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    const endpoint = this.toolEndpoints[name];
    if (!endpoint) {
      return { error: `Unknown tool: ${name}` };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
      const url = new URL(`/api/${endpoint}`, this.baseUrl);

      const safeArgs = args || {};

      // Provide sensible defaults to prevent massive token usage if LLM omits parameters
      if (name === 'getKlines') {
        const toTime = Date.now();
        let fromTime, toTimeFinal = toTime;
        const interval = Number(safeArgs.interval || 86400000); // Default 1 day

        if (safeArgs.timeRange === 'yesterday') {
          toTimeFinal = toTime - 86400000;
          fromTime = toTimeFinal - 86400000;
        } else if (safeArgs.timeRange === 'last_week') {
          fromTime = toTime - 7 * 86400000;
        } else if (safeArgs.timeRange === 'last_month') {
          fromTime = toTime - 30 * 86400000;
        } else {
          fromTime = toTime - interval * 10;
        }

        // Capping to prevent 413 Request Too Large (max 50 candles for LLM)
        const maxCandles = 50;
        if ((toTimeFinal - fromTime) / interval > maxCandles) {
          fromTime = toTimeFinal - (maxCandles * interval);
        }
        
        safeArgs.toTime = toTimeFinal;
        safeArgs.fromTime = fromTime;
        safeArgs.interval = interval;
        delete safeArgs.timeRange;
      } else if (name === 'getNewsLimit') {
        const toTime = Date.now();
        const fromTime = safeArgs.fromTime ?? (toTime - 3 * 86400000); // Default last 3 days
        safeArgs.toTime = safeArgs.toTime ?? toTime;
        safeArgs.fromTime = safeArgs.fromTime ?? fromTime;
        safeArgs.limit = safeArgs.limit ?? 5; // Default max 5 articles to save tokens
      }

      // Append args as query params (all internal API endpoints use GET with query params)
      for (const [key, value] of Object.entries(safeArgs)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }

      const res = await fetch(url.toString(), { signal: controller.signal });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.warn(`Tool ${name} returned HTTP ${res.status}: ${body}`);
        return { error: `API returned HTTP ${res.status}`, details: body };
      }

      return await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Tool ${name} failed: ${message}`);
      return { error: `Tool ${name} failed: ${message}` };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
