import 'dotenv/config'; // <-- Nạp .env sớm để các @Module Decorator có thể đọc được process.env.USE_MOCK
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { winstonConfig } from './common/logger/winston.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonConfig,
  });

  app.setGlobalPrefix('api');

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Crypto Analytics API')
    .setDescription('Backend API for Crypto Market Analytics Dashboard')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
