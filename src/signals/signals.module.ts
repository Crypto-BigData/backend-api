import { Module } from '@nestjs/common';
import { SignalsController } from './signals.controller';
import { SignalsService } from './signals.service';
import { SIGNALS_REPOSITORY } from './constants';
import { MockSignalsRepository } from './repositories/mock-signals.repository';
import { ClickHouseSignalsRepository } from './repositories/clickhouse-signals.repository';

@Module({
  controllers: [SignalsController],
  providers: [
    SignalsService,
    {
      provide: SIGNALS_REPOSITORY,
      useClass: process.env.USE_MOCK === 'true'
        ? MockSignalsRepository
        : ClickHouseSignalsRepository,
    },
  ],
})
export class SignalsModule {}
