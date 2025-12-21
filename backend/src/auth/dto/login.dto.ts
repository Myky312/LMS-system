import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'password123' })
  password!: string;
}
