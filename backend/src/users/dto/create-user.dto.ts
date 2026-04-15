import { z } from 'zod';
import { UserRole } from '../../common/enums';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum([UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT]),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
