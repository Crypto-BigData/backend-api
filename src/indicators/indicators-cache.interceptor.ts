import { ExecutionContext, Injectable } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';

/**
 * Custom CacheInterceptor cho indicators endpoint.
 * Override trackBy() để build cache key từ sorted + deduplicated params
 * thay vì raw URL. Giải quyết vấn đề "ma,rsi" vs "rsi,ma" tạo cache entry khác nhau.
 *
 * Approach này là NestJS first-class pattern, không tạo HTTP round-trip
 * như redirect/rewrite URL.
 */
@Injectable()
export class IndicatorsCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { ticker, fromTime, toTime, interval, indicators } = request.query;

    // Normalize: sort + deduplicate indicators param
    const sorted = [
      ...new Set(
        (indicators || 'ma')
          .split(',')
          .map((s: string) => s.trim().toLowerCase()),
      ),
    ]
      .sort()
      .join(',');

    // Dùng 'latest' thay vì để raw undefined khi caller không truyền fromTime/toTime.
    // Tất cả request "lấy data mới nhất" sẽ share cùng cache entry — đúng hành vi mong muốn.
    // KHÔNG resolve Date.now() ở đây vì interceptor chạy trước controller:
    // mỗi millisecond sẽ tạo cache key khác nhau → cache không bao giờ hit.
    const fromTimeKey = fromTime || 'latest';
    const toTimeKey = toTime || 'latest';

    return `/indicators?ticker=${ticker || 'BTCUSDT'}&fromTime=${fromTimeKey}&toTime=${toTimeKey}&interval=${interval || '300000'}&indicators=${sorted}`;
  }
}

