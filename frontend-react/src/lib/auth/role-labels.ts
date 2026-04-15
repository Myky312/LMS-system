import { USER_ROLES } from "@/lib/auth/roles";

/** Роли с бэкенда уже на английском — показываем по-русски. */
export function roleLabelRu(role: string): string {
  switch (role) {
    case USER_ROLES.ADMIN:
      return "Администратор";
    case USER_ROLES.TEACHER:
      return "Преподаватель";
    case USER_ROLES.STUDENT:
      return "Студент";
    default:
      return role;
  }
}
