# Sprint 3 — Tasks + Media Presign Checklist

**Легенда:** `[x]` сделано · `[~]` заблокировано · `[ ]` не сделано

**Цель:** замкнуть иерархию Course → Module → Lesson → **Task**. Teacher/admin создаёт задания в уроке; типы задач (QUIZ, AUDIO, PHOTO) с разным config; загрузка медиа через presign → S3 → сохранение `fileUrl` в ответ задачи или в ответ студента (Sprint 4).

**Не делать в Sprint 3:** reorder tasks, submissions flow (Sprint 4), video player в уроке, edit/delete task (если бэк не даёт).

**Порядок работ — жёсткий:** сначала контракт и типы, потом media helper, потом task schemas и UI. Не наоборот.

---

## 0. Перед стартом — зафиксировать контракт

### 0.1 Media Presign

- [ ] **POST /media/presign** — request: fileName, contentType (min 1). Response 200: объект с полями?
  - [ ] Зафиксировать точные имена полей в ответе: `uploadUrl`, `fileUrl` или иначе (по Swagger/бэку).
  - [ ] Уточнить формат `fileUrl`: полный URL для отображения/сохранения или только key; куда подставлять в task config (AUDIO → audioUrl, PHOTO → photoUrl и т.д.).
- [ ] Проверить CORS / домены, если загрузка идёт с фронта напрямую на S3 (presigned PUT).

### 0.2 Task shapes

- [ ] **POST /lessons/:lessonId/tasks** — полиморфный body: `type` (QUIZ | AUDIO | PHOTO) + `config` по типу.
- [ ] Зафиксировать в BACKEND_CONTRACT_REPORT (или отдельной заметке):
  - [ ] **QUIZ:** config: question (str min 1), options (массив ровно 4 строки, каждая min 1), correctAnswer (0..3).
  - [ ] **AUDIO:** config: instructions? (str), maxDuration? (int, секунды).
  - [ ] **PHOTO:** config: instructions? (str), requiredElements? (массив строк, каждая min 1).
- [ ] **GET /lessons/:lessonId/tasks** — массив Task; точные поля (id, lessonId, type, config, …) по ответу.
- [ ] **GET /lessons/:lessonId/tasks/:id** — один Task.
- [ ] PATCH/DELETE task — есть ли в бэке; если нет — на фронте только list/create/detail, без edit/delete.

---

## 1. Документация

- [ ] Обновить **BACKEND_CONTRACT_REPORT.md**: секция Media — точный response shape presign; секция Tasks — точные config shapes по типам, response 201/200.
- [ ] Отметить в Known backend gaps: что подтверждено, что нет (например fileUrl format).

---

## 2. Типы и контракт на фронте

- [ ] **types/domain.ts** (или отдельный файл): типы под task config по видам:
  - [ ] QuizTaskConfig, AudioTaskConfig, PhotoTaskConfig (совпадают с бэком).
  - [ ] Task с type и config (discriminated union или общий config).
- [ ] Зафиксировать в коде/комментарии: соответствие полей config бэкенду (question, options, correctAnswer; instructions, maxDuration; requiredElements).

---

## 3. Media helper (presign flow)

- [ ] **features/media/** или **lib/media/**:
  - [ ] Функция (или хук) для получения presign: POST /media/presign с `fileName`, `contentType`; возврат `uploadUrl` и `fileUrl`.
  - [ ] Функция загрузки файла на `uploadUrl` (PUT с телом файла); обработка ошибок сети.
  - [ ] Опционально: общий helper «получить presign → загрузить файл → вернуть fileUrl» для использования в формах AUDIO/PHOTO.
- [ ] Не тянуть в UI «сырой» presign до тех пор, пока не зафиксирован контракт (имена полей, формат fileUrl).

---

## 4. Task API и хуки

- [ ] **features/tasks/api/tasks-api.ts** (или аналог):
  - [ ] createTask(lessonId, payload): POST /lessons/:lessonId/tasks; payload = { type, config }.
  - [ ] fetchTasks(lessonId), fetchTask(lessonId, taskId).
- [ ] **features/tasks/hooks/use-tasks.ts** (или аналог):
  - [ ] useTasksQuery(lessonId), useTaskQuery(lessonId, taskId).
  - [ ] useCreateTaskMutation(lessonId); onSuccess — invalidate tasks list (и при необходимости lesson/cache).
- [ ] Типы payload по типам задач (CreateQuizTaskPayload, CreateAudioTaskPayload, CreatePhotoTaskPayload) в соответствии с контрактом.

---

## 5. Task type schemas (Zod)

- [ ] Схемы валидации под каждый тип задачи (совпадают с бэком):
  - [ ] QUIZ: question min 1; options array length 4, каждый элемент min 1; correctAnswer 0..3.
  - [ ] AUDIO: instructions optional string; maxDuration optional positive integer.
  - [ ] PHOTO: instructions optional string; requiredElements optional array of strings min 1.
- [ ] Общая схема create task: type enum + config по type (discriminated union).
- [ ] Использовать в формах (React Hook Form + zodResolver).

---

## 6. Create task UI

- [ ] Страница (или модалка) создания задания: **маршрут** `/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/tasks/new` (или аналог по текущему роутингу).
- [ ] Выбор типа задачи: QUIZ | AUDIO | PHOTO.
- [ ] Форма по типу:
  - [ ] **QUIZ:** поля question, 4 options, выбор correctAnswer (индекс 0..3).
  - [ ] **AUDIO:** instructions (optional), maxDuration (optional); загрузка файла через presign → сохранение fileUrl в config (если бэк ожидает audioUrl в config при создании — уточнить по контракту).
  - [ ] **PHOTO:** instructions (optional), requiredElements (optional); загрузка через presign при необходимости (если создание задачи уже требует photoUrl — уточнить).
- [ ] Submit → POST create task; при успехе redirect на task details или назад к списку задач.
- [ ] Обработка 400 (валидация config), 403, loading, ошибка сети.

**Важно:** если для AUDIO/PHOTO бэк при создании задачи не принимает fileUrl, а файл загружается позже (например при submit студентом), то в Sprint 3 форма create task для AUDIO/PHOTO не должна требовать загрузку файла — только config (instructions и т.д.). Зафиксировать в контракте.

---

## 7. Task details page

- [ ] **Маршрут:** `/courses/.../lessons/[lessonId]/tasks/[taskId]`.
- [ ] Отображение типа задачи и config (question + options + correct для QUIZ; instructions и т.д. для AUDIO/PHOTO).
- [ ] Ссылка/кнопка «Back to lesson».
- [ ] PageLoader, NotFoundState, ForbiddenState при необходимости.
- [ ] Заглушки для «Submit» (студент) / «Review» (teacher) не делать в Sprint 3, если это Sprint 4.

---

## 8. Lessons list / lesson details — интеграция

- [ ] На странице урока: блок Tasks не заглушка — список задач (useTasksQuery), ссылки на task details.
- [ ] Кнопка «Create task» ведёт на страницу создания задания (выбор типа + форма).
- [ ] Empty state: «No tasks yet» + кнопка Create task.

---

## 9. Edge cases и проверки

- [ ] Два элемента с одинаковым orderIndex (если у tasks есть orderIndex): список не ломается, сортировка стабильна (например по id).
- [ ] Presign: истёкший URL / ошибка загрузки — сообщение пользователю, не терять введённые данные формы где возможно.
- [ ] Create task: не отправлять fileUrl для AUDIO/PHOTO, если бэк не ожидает его при создании (контракт).
- [ ] 400 по config (Zod на бэке) — показывать ошибки валидации в форме.

---

## 10. Deliverable — отчёт по итогу Sprint 3

**Implemented**

- Presign: контракт зафиксирован; media helper (presign + upload); использование в create task при необходимости.
- Task types и Zod schemas (QUIZ, AUDIO, PHOTO) в соответствии с бэком.
- Task API + hooks (create, list, detail).
- Create task UI (выбор типа, формы по типу, submit, redirect).
- Task details page (тип, config, back to lesson).
- Список задач на странице урока, кнопка Create task.

**Verified contract**

- Presign request/response; формат fileUrl; куда подставлять (task config / submission).
- Task create request body по типам; response 201.
- Task list/detail response shapes.

**Blockers**

- Расхождения с Swagger/бэком по config или presign.
- Отсутствие PATCH/DELETE task (если нужно edit — заблокировано).

**Evidence**

- Скрин: страница урока со списком задач.
- Скрин: создание задачи (QUIZ и один из AUDIO/PHOTO).
- Скрин: страница деталей задачи.
- Обновления README / BACKEND_CONTRACT_REPORT.

---

## Краткий порядок работ (не нарушать)

1. Зафиксировать контракт: presign response shape, fileUrl; task config по типам; GET list/detail.
2. Обновить BACKEND_CONTRACT_REPORT (Media, Tasks).
3. Типы domain (task configs, Task).
4. Media helper (presign, upload, возврат fileUrl).
5. Task API + hooks.
6. Zod schemas для create task по типам.
7. Create task UI (страница/модалка, выбор типа, формы).
8. Task details page.
9. Интеграция: список задач на странице урока, Create task.
10. Прогнать сценарии, edge cases; написать отчёт.
