# Sprint 2 — Lessons Checklist

**Легенда:** `[x]` сделано · `[~]` заблокировано · `[ ]` не сделано

**Цель:** довести иерархию до Course → Module → **Lesson**. Teacher/admin может открыть курс → модуль → создать урок → открыть урок; заготовка под список заданий (tasks — Sprint 3).

**Не делать в Sprint 2:** task forms, media upload flow, submissions, video player, edit/delete lesson (если бэк не подтверждён), drag-and-drop.

---

## Перед стартом — проверить контракт (lessons)

Сначала зафиксировать в BACKEND_CONTRACT_REPORT или отдельной заметке:

- [x] **POST /modules/:moduleId/lessons** — request: title, videoUrl optional, orderIndex optional (бэк: createLessonSchema). Response 201 — объект урока (id, moduleId, title, videoUrl, orderIndex).
- [x] **GET /modules/:moduleId/lessons** — массив Lesson (id, moduleId, title, videoUrl, orderIndex).
- [x] **GET /modules/:moduleId/lessons/:id** — один Lesson.
- [~] **PATCH/DELETE** lesson — в контроллере не найдены; edit/delete UI не делаем.
- [x] **videoUrl:** бэк — z.string().url().optional(); в ответе nullable.

---

## 1. API и типы

- [x] **features/lessons/api/lessons-api.ts**: createLesson, fetchLessons, fetchLesson.
- [x] **types:** Lesson (domain.ts), CreateLessonPayload в lessons-api.

---

## 2. Hooks

- [x] useLessonsQuery(moduleId)
- [x] useLessonQuery(moduleId, lessonId)
- [x] useCreateLessonMutation(moduleId) — onSuccess invalidate lessons list.

---

## 3. Страница создания урока

**Маршрут:** `/courses/[courseId]/modules/[moduleId]/lessons/new`

- [x] Форма: только title, videoUrl (optional); orderIndex убран — бэк ставит новый урок в конец.
- [x] Zod: title min 1; videoUrl optional URL или пустая строка.
- [x] Submit → POST; при успехе redirect на lesson details.
- [x] 403 → ForbiddenState; 422 → сообщение в форме; loading → disable submit.
- [x] Кнопка «Back to module».

---

## 4. Страница деталей урока

**Маршрут:** `/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]`

- [x] title, videoUrl (ссылка «Open link» + placeholder под player), позиция (#N).
- [x] «Back to module».
- [x] Блок Tasks: заголовок + EmptyState «No tasks yet» (Sprint 3).
- [x] Кнопка «Create task» — disabled, title «Sprint 3».
- [x] PageLoader, NotFoundState, ForbiddenState.

---

## 5. Lessons list на странице модуля

**Страница:** `/courses/[courseId]/modules/[moduleId]`

- [x] useLessonsQuery из features/lessons.
- [x] title, позиция (#N); при videoUrl — badge «Video».
- [x] Сортировка по orderIndex.
- [x] Клик → lesson details.
- [x] Empty state + кнопка «Create lesson».

---

## 6. Компоненты

- [x] LessonForm (title, videoUrl; zod + RHF).
- [x] PageLoader, EmptyState, ForbiddenState, NotFoundState.

---

## 7. Edit / Delete lesson

- [~] PATCH/DELETE в бэке отсутствуют — edit/delete UI не делаем.

---

## 8. Reorder (modules & lessons)

- [x] orderIndex убран из create module / create lesson forms.
- [x] API: reorder-modules.ts (PATCH …/modules/reorder), reorder-lessons.ts (PATCH …/lessons/reorder).
- [x] Типы ReorderItem, ReorderPayload (domain.ts); buildReorderPayload (lib/utils/reorder.ts).
- [x] useReorderModulesMutation(courseId), useReorderLessonsMutation(moduleId); invalidation после Save.
- [x] @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities.
- [x] ReorderModulesDialog (модалка, sortable list, Save/Cancel, Save disabled пока порядок не менялся).
- [x] ReorderLessonsDialog (аналогично).
- [x] Кнопка «Reorder modules» на странице курса (скрыта при 0–1 модулях).
- [x] Кнопка «Reorder lessons» на странице модуля (скрыта при 0–1 уроках).
- [x] Отображение порядка: #1, #2, #3 вместо «Order: N»; стабильная сортировка по orderIndex.

---

## 9. Deliverable — отчёт по шаблону

По итогу Sprint 2 прислать:

**Implemented**

- create lesson (форма без orderIndex, submit, redirect).
- lessons list на странице модуля (title, #N, video badge, клик в детали).
- lesson details page (title, videoUrl, позиция #N, breadcrumbs, блок Tasks + заглушка Create task).
- lessons API + hooks + types.
- reorder modules / reorder lessons (модалки, drag-and-drop, PATCH reorder, invalidation).

**Verified backend contract**

- lesson create request/response.
- lesson list response.
- lesson details response.
- PATCH/DELETE availability (да/нет).
- videoUrl validation (как валидируется, nullable).

**Blockers**

- отсутствие PATCH/DELETE (если нет).
- любые расхождения со Swagger/бэком.

**Evidence**

- скрин: страница модуля со списком уроков.
- скрин: форма создания урока.
- скрин: страница деталей урока.
- скрин: курс с кнопкой «Reorder modules» и модалка reorder.
- скрин: модуль с кнопкой «Reorder lessons» и модалка reorder.
- обновлённое дерево папок (если менялось).
- обновления README / BACKEND_CONTRACT_REPORT (если что-то уточнили).

---

## Краткий порядок работ

1. Проверить контракт (lessons) по Swagger/бэку; зафиксировать shapes.
2. Добавить API + типы + hooks (lessons).
3. LessonForm + страница create lesson.
4. Страница lesson details + блок Tasks (заглушка).
5. Убедиться, что на странице модуля список уроков полный (video badge, порядок, переход в детали).
6. Проверить все UI states (loading, empty, 403, 404, 422).
7. Написать отчёт по шаблону выше.
