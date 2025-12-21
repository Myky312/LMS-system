import { Module } from '@nestjs/common';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { QuizGraderService } from '../tasks/grading/quiz-grader.service';

@Module({
  controllers: [SubmissionsController],
  providers: [SubmissionsService, QuizGraderService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
