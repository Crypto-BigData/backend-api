import Redis from 'ioredis';
import { Module, Global, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService): Redis => {
        const url = configService.get<string>(
          'REDIS_URL',
          'redis://localhost:6379',
        );

        return new Redis(url, {
          maxRetriesPerRequest: 3,
          retryStrategy(times) {
            // Exponential backoff: 200ms, 400ms, 800ms... cap ở 5s
            return Math.min(times * 200, 5000);
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  private readonly logger = new Logger(RedisModule.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleDestroy() {
    this.logger.log('Closing Redis connection...');
  }
}
