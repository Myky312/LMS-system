import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import * as bcrypt from 'bcrypt';
import { db } from '../database/drizzle';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';
import { LoginDto } from './dto/login.dto';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, loginDto.email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret:
            this.configService.get<string>('jwt.refreshSecret') ??
            'default-secret',
        },
      );

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { userId, email, role };

    const accessSecret =
      this.configService.get<string>('jwt.accessSecret') ?? 'default-secret';
    const refreshSecret =
      this.configService.get<string>('jwt.refreshSecret') ?? 'default-secret';
    const accessExpiresIn =
      this.configService.get<StringValue>('jwt.accessExpiresIn') ?? '15m';
    const refreshExpiresIn =
      this.configService.get<StringValue>('jwt.refreshExpiresIn') ?? '7d';

    const accessOptions: JwtSignOptions = {
      secret: accessSecret,
      expiresIn: accessExpiresIn,
    };

    const refreshOptions: JwtSignOptions = {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, accessOptions),
      this.jwtService.signAsync(payload, refreshOptions),
    ]);

    return { accessToken, refreshToken };
  }
}
