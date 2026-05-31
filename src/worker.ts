import 'dotenv/config'; // Nạp .env sớm — giống pattern main.ts
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker/worker.module';
import { winstonConfig } from './common/logger/winston.config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(WorkerModule, {
    logger: winstonConfig,
  });

  const port = process.env.WORKER_PORT ?? 3002;
  await app.listen(port);

  const logger = new Logger('WorkerApp');
  logger.log(`Worker listening on port ${port}`);
}

bootstrap();
