import {
  Controller,
  Get,
  Post,
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
import { TasksService } from './tasks.service';
import { CreateTaskDto, createTaskSchema } from './dto/create-task.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import { ZodValidationPipe } from '../common/dto/zod-validation.pipe';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('lessons/:lessonId/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a task in a lesson (Teacher only)' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid task config' })
  @ApiResponse({ status: 403, description: 'Not authorized to create task' })
  async create(
    @Param('lessonId') lessonId: string,
    @Body(new ZodValidationPipe(createTaskSchema)) createTaskDto: CreateTaskDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    const teacherId =
      user.role === (UserRole.ADMIN as string) ? undefined : user.userId;
    return this.tasksService.create(lessonId, createTaskDto, teacherId!);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks in a lesson' })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  async findAll(@Param('lessonId') lessonId: string) {
    return this.tasksService.findAll(lessonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }
}
