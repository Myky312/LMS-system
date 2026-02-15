// Load .env before any app code runs (drizzle.ts reads DATABASE_URL at import time)
import { config } from 'dotenv';
config({ path: '.env' });

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix (versioned API)
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors();

  // Note: Validation is handled per-endpoint using ZodValidationPipe with specific schemas

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Structured request logging (correlation ID from RequestIdMiddleware)
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('LMS Backend API')
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

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}/api/v1`,
  );
  console.log(
    `Swagger documentation: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}
void bootstrap();
