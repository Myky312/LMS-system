import { z } from 'zod';
import { UserRole } from '../../common/enums';

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().optional(),
  role: z.enum([UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT]).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
