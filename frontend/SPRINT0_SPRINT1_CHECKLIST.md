# Sprint 0 + Sprint 1 — Checklist ZeekrAcademy Frontend

**Легенда:** `[x]` сделано · `[~]` заблокировано (backend/другое) · `[ ]` не сделано

**Текущий статус:** Sprint 0 и Sprint 1 реализованы. Edit/delete course — заблокированы отсутствием PATCH/DELETE на бэке. Дальше: Sprint 2 (lessons), Sprint 3 (media + tasks), Sprint 4 (submissions).

---

## Sprint 0 — Contract + Foundation

### 0.1 Поднять Next.js app

- [x] Создать проект (TypeScript, Tailwind, App Router, `src/`).
- [x] В `next.config` / `.env.local` при необходимости задать `NEXT_PUBLIC_API_URL`.

### 0.2 Установить библиотеки

- [x] axios, @tanstack/react-query, react-hook-form, @hookform/resolvers, zod.
- [x] shadcn-style компоненты: button, input, label, card, dropdown-menu и др.

### 0.3 Структура папок

- [x] `app/(public)`, `app/(panel)`, `features/*`, `components/ui`, `components/layout`, `components/common`, `lib/api`, `lib/auth`, `lib/constants`, `lib/utils`, `providers`, `types`.

### 0.4 Backend contract

- [x] Contract report собран (BACKEND_CONTRACT_REPORT.md).
- [x] Swagger проверен: login/refresh, Bearer, courses; отсутствие update/delete зафиксировано.

### 0.5 API client

- [x] Axios instance, baseURL из env.
- [x] Request interceptor: `Authorization: Bearer <accessToken>`.
- [x] Response interceptor: при 401 — refresh; при неуспехе — clear + redirect `/login`.
- [x] Нормализация ошибок в один shape.
- [x] Токены не в cookies (body only).

### 0.6 Auth + session foundation

- [x] Auth API: login, refresh, logout.
- [x] Токены: access в memory + sessionStorage, refresh в localStorage (зафиксировано в contract).
- [x] Session: user, isAuthenticated, isLoading, setSession, clearSession.
- [x] При загрузке приложения при наличии refresh — один раз refresh, иначе clear + redirect.
- [x] Типы UserRole, CurrentUser.

### 0.7 Base panel layout

- [x] Layout (panel): sidebar + header + breadcrumbs + page container.
- [x] Sidebar: только «Courses», «Submissions».
- [x] Header: user dropdown (email, role), logout.
- [x] Breadcrumbs по роуту.
- [x] PageLoader, PageError, EmptyState, ForbiddenState, NotFoundState.

### 0.8 Route protection

- [x] Panel: не authenticated → redirect `/login`.
- [x] STUDENT → Forbidden.
- [x] Login: уже authenticated ADMIN/TEACHER → redirect в panel.

### 0.9 Deliverable Sprint 0

- [x] Структура в репо, документация (README, contract, чеклист).

---

## Sprint 1 — Auth + Courses

### 1.1 Login page

- [x] Страница `/login`: форма email + password.
- [x] Zod + RHF, submit → login(), при успехе setSession + redirect `/courses`.
- [x] 401 → сообщение «Invalid credentials», disable submit пока pending.

### 1.2 Protected routes

- [x] Panel требует auth; иначе `/login`.
- [x] STUDENT → Forbidden.
- [x] Logout → clearSession + redirect `/login`.

### 1.3 Current user / role

- [x] Current user из session в layout/header.
- [x] В header: email, роль.
- [x] Роль учитывается (canAccessPanel, условный рендер).

### 1.4 Courses list

- [x] Страница `/courses`: карточки курсов, useCoursesQuery().
- [x] Title, description (сокращённо), дата; кнопка «Create course».
- [x] Клик → `/courses/[courseId]`; 403 → ForbiddenState; loading и empty state.

### 1.5 Create course

- [x] `/courses/new`: форма title, description (optional), Zod.
- [x] useCreateCourseMutation(), onSuccess → invalidate + redirect в `/courses/[id]`.

### 1.6 Course details

- [x] `/courses/[courseId]`: useCourseQuery(), title, description, createdAt.
- [x] Список модулей (useModulesQuery), orderIndex; кнопка «Create module».
- [x] 404 → NotFoundState, 403 → ForbiddenState.

### 1.7 Edit course

- [~] **Заблокировано:** PATCH `/courses/:id` на бэке отсутствует. Страница `/courses/[courseId]/edit` есть — показывает сообщение о недоступности.

### 1.8 Delete course

- [ ] Не реализовано; endpoint DELETE/soft-delete на бэке отсутствует (см. Known backend gaps).

### 1.9 Modules (в рамках Sprint 1)

- [x] Create module: `/courses/[courseId]/modules/new`, форма title, orderIndex.
- [x] Module details: `/courses/[courseId]/modules/[moduleId]`, список уроков, кнопка «Create lesson».
- [ ] Lessons CRUD — Sprint 2; страницы new/detail пока заглушки.

### 1.10 Deliverable Sprint 1

- [x] Маршруты реализованы: login, courses list/new/detail, modules new/detail.
- [x] Problems/blockers зафиксированы: PATCH/DELETE course, см. README «Known limitations» и BACKEND_CONTRACT_REPORT «Known backend gaps».

---

## Команды для копирования

```bash
cd frontend
pnpm install
pnpm add axios @tanstack/react-query react-hook-form @hookform/resolvers zod
# shadcn-style: button, input, label, card, dropdown-menu и т.д.
pnpm dev
```

---

## Текущее состояние (кратко)

- **Sprint 0:** foundation, api client, auth/session (token strategy зафиксирована в contract), panel layout, route protection, общие UI-состояния.
- **Sprint 1:** login, courses list/create/detail, modules list/create/detail; edit course — [~] blocked; delete course — [ ]; lessons/tasks/submissions — заглушки, Sprint 2–4.
