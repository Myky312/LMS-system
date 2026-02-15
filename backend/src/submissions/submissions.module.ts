import { Module } from '@nestjs/common';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { QuizGraderService } from '../tasks/grading/quiz-grader.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // Import AuthModule to use JwtService in JwtAuthGuard
  controllers: [SubmissionsController],
  providers: [SubmissionsService, QuizGraderService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
