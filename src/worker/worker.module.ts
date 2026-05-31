import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { validate } from '../config/env.validation';
import { ClickHouseModule } from '../config/clickhouse.module';
import { RedisModule } from '../config/redis.module';
import { BinanceSyncService } from './binance-sync.service';
import { WorkerKlineService } from './worker-kline.service';

/**
 * Root module cho Worker process (worker.ts).
 * Tái sử dụng ClickHouseModule từ Phase 1 và thêm RedisModule + ScheduleModule.
 * KHÔNG import các feature modules của API server (MarketData, News, Signals).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ScheduleModule.forRoot(),
    ClickHouseModule,
    RedisModule,
  ],
  providers: [BinanceSyncService, WorkerKlineService],
})
export class WorkerModule {}
