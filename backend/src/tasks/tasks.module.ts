import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { LessonsModule } from '../lessons/lessons.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [LessonsModule, AuthModule], // Import AuthModule to use JwtService in JwtAuthGuard
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
