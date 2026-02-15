import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, loginSchema } from './dto/login.dto';
import { RefreshDto, refreshSchema } from './dto/refresh.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ZodValidationPipe } from '../common/dto/zod-validation.pipe';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body(new ZodValidationPipe(loginSchema)) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body(new ZodValidationPipe(refreshSchema)) refreshDto: RefreshDto,
  ) {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout (client should discard tokens)' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  logout() {
    // Since we're using stateless JWT, logout is handled client-side
    // by discarding tokens. This endpoint exists for API completeness.
    return { message: 'Logged out successfully' };
  }
}
