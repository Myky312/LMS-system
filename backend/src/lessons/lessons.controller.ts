import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { CreateLessonDto, createLessonSchema } from './dto/create-lesson.dto';
import {
  ReorderLessonsDto,
  reorderLessonsSchema,
} from './dto/reorder-lessons.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import { ZodValidationPipe } from '../common/dto/zod-validation.pipe';

@ApiTags('lessons')
@ApiBearerAuth()
@Controller('modules/:moduleId/lessons')
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a lesson in a module (Teacher only)' })
  @ApiResponse({ status: 201, description: 'Lesson created successfully' })
  async create(
    @Param('moduleId') moduleId: string,
    @Body(new ZodValidationPipe(createLessonSchema))
    createLessonDto: CreateLessonDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.lessonsService.create(moduleId, createLessonDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all lessons in a module' })
  @ApiResponse({ status: 200, description: 'List of lessons' })
  async findAll(@Param('moduleId') moduleId: string) {
    return this.lessonsService.findAll(moduleId);
  }

  @Patch('reorder')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder lessons in a module' })
  @ApiResponse({ status: 200, description: 'Lessons reordered' })
  @ApiResponse({ status: 400, description: 'Invalid items' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async reorder(
    @Param('moduleId') moduleId: string,
    @Body(new ZodValidationPipe(reorderLessonsSchema))
    reorderDto: ReorderLessonsDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.lessonsService.reorder(
      moduleId,
      reorderDto.items,
      user.userId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lesson by ID' })
  @ApiResponse({ status: 200, description: 'Lesson details' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }
}
