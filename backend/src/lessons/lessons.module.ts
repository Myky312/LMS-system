import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { ModulesModule } from '../modules/modules.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ModulesModule, AuthModule], // Import AuthModule to use JwtService in JwtAuthGuard
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
