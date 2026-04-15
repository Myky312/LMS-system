/** Main app navigation — keep in sync with protected routes in `AppRouters.tsx`. */
export type AppNavItem = {
  to: string;
  label: string;
  icon: string;
  /** If set, only these roles see the item (matches `SessionUser.role`). */
  roles?: readonly string[];
};

export const appNavItems: AppNavItem[] = [
  { to: "/dashboard", label: "Главная", icon: "pi pi-home" },
  { to: "/courses", label: "Курсы", icon: "pi pi-book" },
  { to: "/courses/new", label: "Новый курс", icon: "pi pi-plus", roles: ["ADMIN", "TEACHER"] },
  { to: "/users", label: "Пользователи", icon: "pi pi-users", roles: ["ADMIN"] },
];
