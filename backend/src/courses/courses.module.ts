import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // Import AuthModule to use JwtService in JwtAuthGuard
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService], // Export for ModulesService to use
})
export class CoursesModule {}
