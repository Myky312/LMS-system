# Sprint 3 — Tasks (CRUD-light) + Media Presign Prep

**Легенда:** `[x]` сделано · `[~]` заблокировано · `[ ]` не сделано

**Цель Sprint 3:** Task CRUD-light — create, list, detail для типов QUIZ, AUDIO, PHOTO. Без обязательного media upload в создании задачи. Presign helper можно подготовить как технический слой, но **не встраивать в create task UI**, пока контракт не подтверждён.

**Не делать в Sprint 3:** reorder tasks, submissions / review (Sprint 4), video player в уроке, edit/delete task (если бэка нет), upload файла в формах создания AUDIO/PHOTO (см. контракт ниже).

**Порядок работ:** сначала подтвердить контракт → типы → опционально media helper → task API → Zod schemas → UI. Не наоборот.

---

## Перед тем как кодить — ответить на 3 вопроса

Пока фронтендер не ответил по Swagger / реальному ответу бэка, в UI лезть рано.

1. **Что именно возвращает POST /media/presign?** (точные имена полей, формат `fileUrl` — полный URL или key.)
2. **Нужен ли загруженный файл при create task для AUDIO/PHOTO?** По текущему контракту — **нет**: config AUDIO = instructions, maxDuration; config PHOTO = instructions, requiredElements. URL файлов — это данные **submission answer**, а не task config. Подтвердить по бэку.
3. **Что именно приходит в GET /lessons/:lessonId/tasks и GET /lessons/:lessonId/tasks/:id?** (поля, shape config по типам.)

---

## Часть A. Confirm before coding

### A.1 Media Presign (подготовительный блок)

- [ ] Подтвердить точный **response shape** POST /media/presign (имена полей: uploadUrl, fileUrl или иначе).
- [ ] Подтвердить формат **fileUrl** (полный URL vs key).
- [ ] Выяснить: нужен ли presign **для create task** в Sprint 3, или только для student submissions (Sprint 4).
- [ ] **Если presign не нужен для create task** — media helper в Sprint 3 реализовать отдельно (presign + upload), **не встраивать в create task form**. Встраивать только после явного подтверждения контракта.

### A.2 Task contract

- [ ] **POST /lessons/:lessonId/tasks** — body: type (QUIZ | AUDIO | PHOTO) + config по типу. Зафиксировать в BACKEND_CONTRACT_REPORT:
  - **QUIZ:** question (str min 1), options (массив ровно 4 строки, каждая min 1), correctAnswer (0..3).
  - **AUDIO:** instructions? (str), maxDuration? (int, секунды). **Без audioUrl в config.**
  - **PHOTO:** instructions? (str), requiredElements? (массив строк, каждая min 1). **Без photoUrl в config.**
- [ ] **GET** list и GET by id — точные поля (id, lessonId, type, config, …) по ответу.
- [ ] PATCH/DELETE task — есть ли; если нет — на фронте только list/create/detail.

---

## Часть B. Implement

### B.1 Документация

- [ ] Обновить **BACKEND_CONTRACT_REPORT.md**: Tasks — точные config shapes, response 201; Media — response shape presign (по мере подтверждения). Полное объяснение про AUDIO/PHOTO и upload — уже в контракте (Important frontend note); в чеклисте не дублировать.

### B.2 Типы (domain)

- [ ] **types/domain.ts**: QuizTaskConfig, AudioTaskConfig, PhotoTaskConfig (без полей audioUrl/photoUrl в config).
- [ ] Task: type + config (**discriminated union по type**). В UI: ветвление по `task.type`, сужение `config` по типу; **не** обращаться к `task.config` «на глаз» и не кастить в `any` — иначе TypeScript станет декоративным.
- [ ] Соответствие полей бэкенду зафиксировать в коде/комментарии.

### B.3 Media helper (technical preparation only)

- [ ] **features/media/** или **lib/media/**:
  - [ ] Функция получения presign: POST /media/presign → возврат полей из контракта (uploadUrl, fileUrl после подтверждения).
  - [ ] Функция загрузки файла на uploadUrl (PUT); обработка ошибок.
- [ ] **Sprint 3: только техническая подготовка.** Не встраивать в create task form; не подключать к UI без подтверждённого контракта.

### B.4 Task API и хуки

- [ ] **features/tasks/api/tasks-api.ts**: createTask(lessonId, payload), fetchTasks(lessonId), fetchTask(lessonId, taskId).
- [ ] **features/tasks/hooks/use-tasks.ts**: useTasksQuery(lessonId), useTaskQuery(lessonId, taskId), useCreateTaskMutation(lessonId); onSuccess invalidate tasks list.
- [ ] Payload-типы по типам задач (CreateQuizTaskPayload, CreateAudioTaskPayload, CreatePhotoTaskPayload) без полей file/url в config.

### B.5 Task type schemas (Zod)

- [ ] **QUIZ:**
  - [ ] question — min 1, trim.
  - [ ] options — массив ровно 4; каждый элемент min 1 после trim; не допускать пустые строки.
  - [ ] correctAnswer — число 0..3 (индекс существующего option).
- [ ] **AUDIO:**
  - [ ] instructions — optional string, trim.
  - [ ] maxDuration — optional; если передан — целое положительное.
- [ ] **PHOTO:**
  - [ ] instructions — optional string, trim.
  - [ ] requiredElements — optional array; пустые элементы после trim удалять перед submit (не отправлять `["", "tajweed"]`).
- [ ] Общая схема create task: type enum + config по type (discriminated union).
- [ ] Использовать в формах (React Hook Form + zodResolver).

### B.6 Create task UI

- [ ] Маршрут: `/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/tasks/new` (или аналог по роутингу).
- [ ] Выбор типа: QUIZ | AUDIO | PHOTO.
- [ ] **Формы по типу — жёстко:**
  - [ ] **QUIZ:** question, 4 options, выбор correctAnswer (0..3). Полноценная форма.
  - [ ] **AUDIO:** только instructions, maxDuration. **Не делать upload в Sprint 3.**
  - [ ] **PHOTO:** только instructions, requiredElements. **Не делать upload в Sprint 3.**
- [ ] Явно: пока не подтверждено, что backend ждёт fileUrl в task config при создании, полей загрузки файла в create task для AUDIO/PHOTO не делать.
- [ ] Submit → POST create task; при успехе redirect на task details или к списку задач.
- [ ] Обработка 400 (валидация config), 403, loading, ошибка сети.

### B.7 Task details page

- [ ] Маршрут: `/courses/.../lessons/[lessonId]/tasks/[taskId]`.
- [ ] **По типам отображать явно:**
  - [ ] **QUIZ:** question, 4 options, выделение/подпись правильного ответа (correctAnswer).
  - [ ] **AUDIO:** instructions, maxDuration.
  - [ ] **PHOTO:** instructions, список requiredElements.
- [ ] Кнопка «Back to lesson».
- [ ] PageLoader, NotFoundState, ForbiddenState.
- [ ] **Не добавлять** элементы Submit (студент) / Review (teacher) — это Sprint 4.

### B.8 Интеграция на странице урока

- [ ] Блок Tasks: список задач (useTasksQuery), ссылки на task details.
- [ ] Список сортировать стабильно по правилу, подтверждённому контрактом (например по id или createdAt, если бэк отдаёт; fallback по id).
- [ ] Карточка задачи в списке должна показывать тип + **summary по правилу (не JSON.stringify(config)):**
  - [ ] **QUIZ:** первая строка/фрагмент `question` (или полный question, если короткий).
  - [ ] **AUDIO:** `instructions` или fallback «Audio task»; при наличии `maxDuration` — отдельная подпись (например «max N sec»).
  - [ ] **PHOTO:** `instructions` или fallback «Photo task»; при наличии `requiredElements` — подпись с количеством (например «N elements»).
- [ ] Кнопка «Create task» → страница создания (выбор типа + форма).
- [ ] Empty state: «No tasks yet» + кнопка Create task.

---

## Часть C. Edge cases и проверки

- [ ] Список задач: стабильная сортировка по полю из контракта (id, createdAt и т.д.); при равенстве — по id.
- [ ] 400 по config — показывать ошибки валидации в форме.
- [ ] Create task: не отправлять fileUrl / audioUrl / photoUrl в config для AUDIO/PHOTO по текущему контракту.

---

## Deliverable — отчёт по итогу Sprint 3

**Implemented**

- Task contract подтверждён и зафиксирован; task types (domain); Zod schemas (QUIZ, AUDIO, PHOTO без upload в config).
- Task API + hooks (create, list, detail).
- Create task page (QUIZ полная форма; AUDIO/PHOTO только instructions + maxDuration / requiredElements, без upload).
- Task details page (по типам: question/options/correct, instructions/maxDuration, instructions/requiredElements).
- Список задач на странице урока (тип + summary, стабильная сортировка).
- Media presign: контракт уточнён; media helper при необходимости реализован отдельно, **не в create task UI** (если контракт не требовал).

**Verified contract**

- Task create request body по типам; response 201.
- Task list/detail response shapes.
- Presign: response shape; решение по использованию в create task (да/нет).

**Blockers**

- Расхождения с Swagger/бэком по config или presign.
- Отсутствие PATCH/DELETE task.

**Evidence**

- Скрин: страница урока со списком задач (тип + summary).
- Скрин: создание задачи QUIZ и AUDIO или PHOTO (без upload).
- Скрин: страница деталей задачи.
- Обновления README / BACKEND_CONTRACT_REPORT.

---

## Краткий порядок работ (не нарушать)

1. Ответить на 3 вопроса (presign response; нужен ли upload при create task; GET tasks shape).
2. Зафиксировать контракт (A.1, A.2), обновить BACKEND_CONTRACT_REPORT (B.1).
3. Типы domain (B.2).
4. Опционально: media helper (B.3), без подключения к create task form.
5. Task API + hooks (B.4).
6. Zod schemas (B.5).
7. Create task UI (B.6).
8. Task details page (B.7).
9. Интеграция на странице урока (B.8).
10. Edge cases; отчёт.
