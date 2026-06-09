import {
  Controller,
  Get,
  Query,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { CacheTTL } from '@nestjs/cache-manager';
import { IndicatorsCacheInterceptor } from './indicators-cache.interceptor';
import { IndicatorsService } from './indicators.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IndicatorQueryDto } from './dto/indicator-query.dto';
import { IndicatorResponseDto } from './dto/indicator-response.dto';

const SUPPORTED_INDICATORS = ['ma', 'ema', 'rsi', 'bb'] as const;

@ApiTags('Indicators')
@Controller('indicators')
@UseInterceptors(IndicatorsCacheInterceptor)
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get technical indicators (MA, EMA, RSI, Bollinger Bands)' })
  @ApiResponse({ status: 200, description: 'Indicators result object', type: IndicatorResponseDto })
  @CacheTTL(60000) // 60s — cùng TTL với kline
  async getIndicators(@Query() query: IndicatorQueryDto) {
    // 1. Parse & validate indicators param
    const requested = (query.indicators ?? 'ma')
      .split(',')
      .map((s) => s.trim().toLowerCase());
    const invalid = requested.filter(
      (i) => !(SUPPORTED_INDICATORS as readonly string[]).includes(i),
    );
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Unknown indicator(s): ${invalid.join(', ')}. Supported: ${SUPPORTED_INDICATORS.join(', ')}`,
      );
    }

    // 2. Deduplicate + sort (cache key đã normalized bởi IndicatorsCacheInterceptor)
    const sorted = [...new Set(requested)].sort();

    // 3. Parse time params (same pattern as kline controller)
    const now = Date.now();
    const from = query.fromTime ? Number(query.fromTime) : now - 24 * 60 * 60 * 1000;
    const to = query.toTime ? Number(query.toTime) : now;
    const intervalMs = Number(query.interval ?? '300000');
    const tickerStr = query.ticker?.toUpperCase() ?? 'BTCUSDT';
    
    // 3. Delegate to service
    return this.indicatorsService.calculate(
      tickerStr,
      from,
      to,
      intervalMs,
      sorted,
    );
  }
}
