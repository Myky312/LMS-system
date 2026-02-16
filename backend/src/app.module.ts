import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { IpThrottlerGuard } from './common/guards/ip-throttler.guard';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { ModulesModule } from './modules/modules.module';
import { LessonsModule } from './lessons/lessons.module';
import { TasksModule } from './tasks/tasks.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { MediaModule } from './media/media.module';
import { HealthModule } from './health';
import { MetricsModule } from './metrics/metrics.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import s3Config from './config/s3.config';

const LOG_LEVELS = ['info', 'debug', 'warn', 'error'] as const;

function resolveLogLevel(): (typeof LOG_LEVELS)[number] {
  const env = process.env.LOG_LEVEL?.toLowerCase();
  if (env && LOG_LEVELS.includes(env as (typeof LOG_LEVELS)[number])) {
    return env as (typeof LOG_LEVELS)[number];
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- nestjs-pino LoggerModule
    LoggerModule.forRoot({
      pinoHttp: {
        level: resolveLogLevel(),
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, jwtConfig, s3Config],
    }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- @nestjs/throttler
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000, // 60 seconds (ttl is in milliseconds)
          limit: 100,
        },
      ],
    }),
    AuthModule,
    CoursesModule,
    ModulesModule,
    LessonsModule,
    TasksModule,
    SubmissionsModule,
    MediaModule,
    HealthModule,
    MetricsModule,
  ],
  providers: [
    ...(process.env.NODE_ENV !== 'test'
      ? [
          {
            provide: APP_GUARD,
            useClass: IpThrottlerGuard,
          },
        ]
      : []),
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
