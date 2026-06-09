import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  CLICKHOUSE_URL: string = 'http://localhost:8123';

  @IsString()
  @IsOptional()
  CLICKHOUSE_DATABASE: string = 'default';

  @IsString()
  @IsOptional()
  CLICKHOUSE_USER: string = 'default';

  @IsString()
  @IsOptional()
  CLICKHOUSE_PASSWORD: string = '';

  @IsNumber()
  @IsOptional()
  WORKER_PORT: number = 3002;

  @IsNumber()
  @IsOptional()
  BACKFILL_MONTHS: number = 6;

  @IsString()
  @IsOptional()
  COINDESK_API_KEYS: string = '';

  @IsString()
  @IsOptional()
  USE_MOCK: string = 'true';

  @IsString()
  @IsOptional()
  OPENAI_API_KEY: string = '';

  @IsString()
  @IsOptional()
  OPENAI_MODEL: string = 'gpt-4o-mini';

  @IsString()
  @IsOptional()
  INTERNAL_API_BASE: string = '';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
