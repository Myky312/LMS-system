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
import { ModulesService } from './modules.service';
import { CreateModuleDto, createModuleSchema } from './dto/create-module.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import { ZodValidationPipe } from '../common/dto/zod-validation.pipe';

@ApiTags('modules')
@ApiBearerAuth()
@Controller('courses/:courseId/modules')
@UseGuards(JwtAuthGuard)
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a module in a course (Teacher only)' })
  @ApiResponse({ status: 201, description: 'Module created successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to create module' })
  async create(
    @Param('courseId') courseId: string,
    @Body(new ZodValidationPipe(createModuleSchema))
    createModuleDto: CreateModuleDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.modulesService.create(courseId, createModuleDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all modules in a course' })
  @ApiResponse({ status: 200, description: 'List of modules' })
  async findAll(@Param('courseId') courseId: string) {
    return this.modulesService.findAll(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a module by ID' })
  @ApiResponse({ status: 200, description: 'Module details' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }
}
