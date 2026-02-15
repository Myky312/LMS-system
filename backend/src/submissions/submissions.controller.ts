import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SubmissionsService } from './submissions.service';
import { SubmitTaskDto, submitTaskSchema } from './dto/submit-task.dto';
import {
  ReviewSubmissionDto,
  reviewSubmissionSchema,
} from './dto/review-submission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, SubmissionStatus } from '../common/enums';
import { ZodValidationPipe } from '../common/dto/zod-validation.pipe';

@ApiTags('submissions')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post('tasks/:id/submit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a task (Student only)' })
  @ApiResponse({ status: 201, description: 'Task submitted successfully' })
  @ApiResponse({ status: 400, description: 'Submission already exists' })
  async submit(
    @Param('id') taskId: string,
    @Body(new ZodValidationPipe(submitTaskSchema)) submitTaskDto: SubmitTaskDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.submissionsService.submit(taskId, submitTaskDto, user.userId);
  }

  @Get('submissions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all submissions (Teacher only)' })
  @ApiQuery({ name: 'status', enum: SubmissionStatus, required: false })
  @ApiResponse({ status: 200, description: 'List of submissions' })
  async findAll(
    @Query('status') status?: SubmissionStatus,
    @CurrentUser() user?: { userId: string; role: string },
  ) {
    const teacherId =
      user?.role === (UserRole.ADMIN as string) ? undefined : user?.userId;
    return this.submissionsService.findAll(status, teacherId);
  }

  @Get('submissions/:id')
  @ApiOperation({ summary: 'Get a submission by ID' })
  @ApiResponse({ status: 200, description: 'Submission details' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async findOne(@Param('id') id: string) {
    return this.submissionsService.findOne(id);
  }

  @Patch('submissions/:id/review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review a submission (Teacher only)' })
  @ApiResponse({ status: 200, description: 'Submission reviewed successfully' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to review this submission',
  })
  async review(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reviewSubmissionSchema))
    reviewDto: ReviewSubmissionDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    const teacherId =
      (user.role as UserRole) === UserRole.ADMIN ? undefined : user.userId;
    return this.submissionsService.review(id, reviewDto, teacherId!);
  }
}
