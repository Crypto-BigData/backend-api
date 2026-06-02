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
import { IndicatorResult } from './interfaces/indicator-result.interface';

const SUPPORTED_INDICATORS = ['ma', 'ema', 'rsi', 'bb'] as const;

@Controller('indicators')
@UseInterceptors(IndicatorsCacheInterceptor)
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Get()
  @CacheTTL(60000) // 60s — cùng TTL với kline
  async getIndicators(
    @Query('ticker') ticker: string = 'BTCUSDT',
    @Query('fromTime') fromTime?: string,
    @Query('toTime') toTime?: string,
    @Query('interval') interval: string = '300000',
    @Query('indicators') indicatorsParam: string = 'ma',
  ): Promise<IndicatorResult> {
    // 1. Parse & validate indicators param
    const requested = indicatorsParam
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
    const from = fromTime ? Number(fromTime) : now - 24 * 60 * 60 * 1000;
    const to = toTime ? Number(toTime) : now;
    const intervalMs = Number(interval);

    return this.indicatorsService.calculate(
      ticker.toUpperCase(),
      from,
      to,
      intervalMs,
      sorted,
    );
  }
}
