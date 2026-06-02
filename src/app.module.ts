import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validate } from './config/env.validation';
import { ClickHouseModule } from './config/clickhouse.module';
import { MarketDataModule } from './market-data/market-data.module';
import { NewsModule } from './news/news.module';
import { SignalsModule } from './signals/signals.module';
import { OverviewModule } from './overview/overview.module';
import { IndicatorsModule } from './indicators/indicators.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    ClickHouseModule,
    MarketDataModule,
    NewsModule,
    SignalsModule,
    OverviewModule,
    IndicatorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
