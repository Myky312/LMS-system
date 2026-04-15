import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { and, count, desc, eq, gte, ilike, type SQL } from 'drizzle-orm';
import { db } from '../database/drizzle';
import { users } from '../database/schema';
import { UserRole } from '../common/enums';
import type { CreateUserDto } from './dto/create-user.dto';
import type { ListUsersQuery } from './dto/list-users-query.dto';

export type UserPublicRow = {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
};

@Injectable()
export class UsersService {
  async findMany(query: ListUsersQuery) {
    const { page, limit, q, role: roleFilter } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (q?.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(ilike(users.email, term));
    }
    if (roleFilter) {
      conditions.push(eq(users.role, roleFilter));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [countRow] = await db
      .select({ total: count() })
      .from(users)
      .where(whereClause);

    const total = Number(countRow?.total ?? 0);

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      items: rows,
      total,
      page,
      limit,
    };
  }

  async getStats() {
    const [{ total }] = await db.select({ total: count() }).from(users);

    const [{ n: teachers }] = await db
      .select({ n: count() })
      .from(users)
      .where(eq(users.role, UserRole.TEACHER));

    const [{ n: students }] = await db
      .select({ n: count() })
      .from(users)
      .where(eq(users.role, UserRole.STUDENT));

    const [{ n: admins }] = await db
      .select({ n: count() })
      .from(users)
      .where(eq(users.role, UserRole.ADMIN));

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const [{ n: newThisMonth }] = await db
      .select({ n: count() })
      .from(users)
      .where(gte(users.createdAt, startOfMonth));

    return {
      total: Number(total ?? 0),
      teachers: Number(teachers ?? 0),
      students: Number(students ?? 0),
      admins: Number(admins ?? 0),
      newThisMonth: Number(newThisMonth ?? 0),
    };
  }

  async create(dto: CreateUserDto): Promise<UserPublicRow> {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const [created] = await db
        .insert(users)
        .values({
          email: dto.email.trim().toLowerCase(),
          passwordHash,
          role: dto.role,
        })
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        });

      if (!created) {
        throw new ConflictException('Could not create user');
      }
      return created;
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === '23505') {
        throw new ConflictException('User with this email already exists');
      }
      throw err;
    }
  }
}
