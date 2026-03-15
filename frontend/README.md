# ZeekrAcademy Frontend — Admin & Teacher Panel

Phase 1 frontend для LMS: auth, курсы, модули, уроки, задания, ревью сабмитов, media presign. Построен по иерархии бэкенда и ролям (ADMIN / TEACHER).

## Стек

| Технология | Назначение |
|------------|------------|
| Next.js 15 | App Router (panel routes — client-side with SessionProvider + React Query + Bearer auth) |
| TypeScript | Строгая типизация |
| Tailwind CSS | Стили |
| shadcn-style UI | Button, Input, Card, Dropdown, Label и др. |
| TanStack Query | Серверный state, кэш |
| React Hook Form + Zod | Формы и валидация |
| Axios | HTTP, interceptors, refresh |

## Требования

- **Node.js 20+** (совместимо с backend в одном репо)
- **pnpm 8+**
- Запущенный бэкенд (локально или Docker) на `http://localhost:3000`

## Установка и запуск

```bash
cd frontend
pnpm install
```

Опционально — свой URL API:

```bash
cp .env.local.example .env.local
# Отредактировать NEXT_PUBLIC_API_URL при необходимости
```

Запуск в dev:

```bash
pnpm dev
```

Приложение откроется на `http://localhost:3001` (или другом порту, если 3000 занят).

Сборка и старт production:

```bash
pnpm build
pnpm start
```

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `NEXT_PUBLIC_API_URL` | Base URL API бэкенда | `http://localhost:3000/api/v1` |

## Маршруты

**Важно:** навигация иерархическая. **Modules, Lessons и Tasks не являются top-level страницами** — они доступны только внутри курса (Course → Module → Lesson → Task). В сайдбаре только «Courses» и «Submissions»; отдельно пунктов «Modules», «Lessons», «Tasks» нет.

### Публичные

- **`/login`** — вход (email / пароль). После успеха редирект в `/courses` для ADMIN/TEACHER.

### Панель (только ADMIN / TEACHER)

**Реализовано:**

- `/courses` — список курсов
- `/courses/new` — создание курса
- `/courses/[courseId]` — детали курса, список модулей
- `/courses/[courseId]/modules/new` — создание модуля
- `/courses/[courseId]/modules/[moduleId]` — детали модуля, список уроков

**Заглушки / planned:**

- `/courses/[courseId]/edit` — страница есть; редактирование недоступно до появления PATCH на бэке
- `/courses/[courseId]/modules/[moduleId]/lessons/new` — Sprint 2
- `/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]` — Sprint 2
- `/submissions` — Sprint 4

## Структура проекта

```
frontend/
├── src/
│   ├── app/
│   │   ├── (public)/          # Публичные страницы
│   │   │   ├── layout.tsx
│   │   │   └── login/page.tsx
│   │   ├── (panel)/           # Защищённая панель
│   │   │   ├── layout.tsx     # Sidebar, Header, Breadcrumbs
│   │   │   ├── courses/       # CRUD курсов, вложенные модули/уроки
│   │   │   └── submissions/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Редирект на /login
│   │   └── globals.css
│   ├── features/              # Доменные фичи
│   │   ├── auth/              # API login/refresh, LoginForm
│   │   ├── session/           # SessionProvider, useSession
│   │   ├── courses/           # API, hooks, CourseForm
│   │   ├── modules/           # API, hooks
│   │   └── ...
│   ├── components/
│   │   ├── ui/                # Button, Input, Card, Label, Dropdown
│   │   ├── layout/            # Sidebar, Header, Breadcrumbs
│   │   └── common/            # PageLoader, PageError, EmptyState, ForbiddenState, NotFoundState
│   ├── lib/
│   │   ├── api/               # axios client, interceptors, normalizeError
│   │   ├── auth/              # token storage
│   │   ├── constants/         # API_BASE_URL
│   │   └── utils/             # cn, formatDate
│   ├── providers/             # React Query + SessionProvider
│   └── types/                 # domain.ts (User, Course, Module, Lesson, Task, Submission)
├── BACKEND_CONTRACT_REPORT.md
├── SPRINT0_SPRINT1_CHECKLIST.md
├── .env.local.example
└── package.json
```

## Реализовано сейчас

- Auth (login, refresh, logout), защита панели, current user в header
- Courses: список, создание, детали, список модулей внутри курса
- Modules: создание, детали, список уроков внутри модуля
- Маршруты lessons / submissions пока заглушки

## Known limitations (backend gaps)

- **Edit course** — недоступно, пока бэкенд не отдаёт `PATCH /courses/:id`.
- **Delete course** — недоступно, пока нет HTTP endpoint для soft delete.
- **Current user** — endpoint `/auth/me` отсутствует; пользователь берётся из session state после login/refresh; при перезагрузке — один раз refresh по refresh token, при неуспехе — очистка сессии и редирект на `/login`.
- **Lessons / Tasks / Submissions** — полный CRUD и ревью ещё не реализованы на фронте (Sprint 2–4).

## Документация

- **[BACKEND_CONTRACT_REPORT.md](./BACKEND_CONTRACT_REPORT.md)** — контракт API: auth, токены, endpoints, payloads, ошибки, known backend gaps. Сверить с Swagger перед доработками.
- **[SPRINT0_SPRINT1_CHECKLIST.md](./SPRINT0_SPRINT1_CHECKLIST.md)** — чеклист Sprint 0 и Sprint 1 в формате статусов [x] / [~] / [ ].

## Тестовый вход

После применения миграций бэкенда (в т.ч. сида с админом):

- **Email:** `admin@zeekracademy.com`
- **Пароль:** `zeekradmin`

## Скрипты

| Команда | Описание |
|---------|----------|
| `pnpm dev` | Режим разработки |
| `pnpm build` | Сборка для production |
| `pnpm start` | Запуск production-сборки |
| `pnpm lint` | ESLint |
