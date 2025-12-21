import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

export class RefreshDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken!: string;
}
