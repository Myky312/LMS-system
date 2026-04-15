import type { SessionUser } from "@/lib/auth/session";

export const USER_ROLES = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
} as const;

export function isTeacherOrAdmin(user: SessionUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.TEACHER;
}
