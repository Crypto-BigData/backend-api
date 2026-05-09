import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const winstonConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.utilities.format.nestLike('BackendAPI', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),
  ],
});
