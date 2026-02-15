import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { IpThrottlerGuard } from './common/guards/ip-throttler.guard';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { ModulesModule } from './modules/modules.module';
import { LessonsModule } from './lessons/lessons.module';
import { TasksModule } from './tasks/tasks.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { MediaModule } from './media/media.module';
import { HealthModule } from './health';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import s3Config from './config/s3.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, jwtConfig, s3Config],
    }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- @nestjs/throttler types
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
