// Load .env before any app code runs (drizzle.ts reads DATABASE_URL at import time)
import { config } from 'dotenv';
config({ path: '.env' });

import { LoggerService } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- nestjs-pino Logger token
  const pinoLogger = app.get<LoggerService>(Logger);
  app.useLogger(pinoLogger);

  // Graceful shutdown: handle SIGTERM/SIGINT and close connections cleanly
  app.enableShutdownHooks();

  // Trust first proxy (e.g. Nginx, load balancer). Required for correct req.ip and rate limiting.
  const expressInstance = app.getHttpAdapter().getInstance() as {
    set: (key: string, value: number) => void;
  };
  expressInstance.set('trust proxy', 1);

  // Global prefix (versioned API)
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors();

  // Note: Validation is handled per-endpoint using ZodValidationPipe with specific schemas

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('ZeekrAcademy API')
    .setDescription('Learning Management System Backend API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  pinoLogger.log(`Application is running on: http://localhost:${port}/api/v1`);
  pinoLogger.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}
void bootstrap();
