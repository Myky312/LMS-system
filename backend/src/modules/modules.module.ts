import { Module } from '@nestjs/common';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { CoursesModule } from '../courses/courses.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CoursesModule, AuthModule], // Import AuthModule to use JwtService in JwtAuthGuard
  controllers: [ModulesController],
  providers: [ModulesService],
  exports: [ModulesService],
})
export class ModulesModule {}
