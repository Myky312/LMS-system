import { db } from '../../src/database/drizzle';
import { users } from '../../src/database/schema';
import { sql, eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../src/common/enums';
import { testUsers } from './auth';

/**
 * Truncate all tables and reset sequences
 * Call before each test suite
 */
export async function truncateAllTables(): Promise<void> {
  // Disable foreign key checks temporarily
  await db.execute(sql`SET session_replication_role = 'replica'`);

  await db.execute(sql`TRUNCATE TABLE task_submissions CASCADE`);
  await db.execute(sql`TRUNCATE TABLE tasks CASCADE`);
  await db.execute(sql`TRUNCATE TABLE lessons CASCADE`);
  await db.execute(sql`TRUNCATE TABLE modules CASCADE`);
  await db.execute(sql`TRUNCATE TABLE courses CASCADE`);
  await db.execute(sql`TRUNCATE TABLE users CASCADE`);

  // Re-enable foreign key checks
  await db.execute(sql`SET session_replication_role = 'origin'`);
}

/**
 * Seed test users
 * Creates admin, teacherA, teacherB, student
 */
export async function seedUsers(): Promise<void> {
  await db.insert(users).values([
    {
      email: testUsers.admin.email,
      passwordHash: await bcrypt.hash(testUsers.admin.password, 10),
      role: UserRole.ADMIN,
    },
    {
      email: testUsers.teacherA.email,
      passwordHash: await bcrypt.hash(testUsers.teacherA.password, 10),
      role: UserRole.TEACHER,
    },
    {
      email: testUsers.teacherB.email,
      passwordHash: await bcrypt.hash(testUsers.teacherB.password, 10),
      role: UserRole.TEACHER,
    },
    {
      email: testUsers.student.email,
      passwordHash: await bcrypt.hash(testUsers.student.password, 10),
      role: UserRole.STUDENT,
    },
  ]);
}

/**
 * Get user ID by email
 */
export async function getUserIdByEmail(email: string): Promise<string> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  return user.id;
}

