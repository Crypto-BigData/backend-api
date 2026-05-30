import { createClient, ClickHouseClient } from '@clickhouse/client';
import { Module, Global, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const CLICKHOUSE_CLIENT = 'CLICKHOUSE_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: CLICKHOUSE_CLIENT,
      useFactory: (configService: ConfigService): ClickHouseClient => {
        const url = configService.get<string>('CLICKHOUSE_URL', 'http://localhost:8123');
        const database = configService.get<string>('CLICKHOUSE_DATABASE', 'default');
        const username = configService.get<string>('CLICKHOUSE_USER', 'default');
        const password = configService.get<string>('CLICKHOUSE_PASSWORD', '');

        return createClient({
          url,
          database,
          username,
          password,
          // ClickHouse trả về Decimal dạng string — giữ nguyên để tránh mất precision
          clickhouse_settings: {
            output_format_decimal_as_string: 1,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [CLICKHOUSE_CLIENT],
})
export class ClickHouseModule implements OnModuleDestroy {
  private readonly logger = new Logger(ClickHouseModule.name);

  constructor(
    private readonly configService: ConfigService,
  ) {}

  async onModuleDestroy() {
    // Graceful shutdown — NestJS gọi khi app tắt
    this.logger.log('Closing ClickHouse connection...');
  }
}
