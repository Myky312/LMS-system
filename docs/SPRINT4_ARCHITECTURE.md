# Sprint 4 — Submissions + Review Flow: Architecture & Contract

Этот документ фиксирует **архитектурные правила** и **контракт** для полного цикла: task → student submits → teacher reviews → grade. Правила нельзя нарушать при доработках.

---

## 1. Четыре обязательных правила

### 1.1 Task и Submission строго разделены

| Сущность | Содержит | Не содержит |
|----------|----------|-------------|
| **Task** | `type`, `config`, `lessonId`. Требования задания (вопрос, опции, инструкции, maxDuration, requiredElements). | Никаких полей ответа студента: не `audioUrl`, не `photoUrl`, не `score`, не `feedback`, не `submittedAt`. |
| **Submission** | `taskId`, `studentId`, `answer`, `status`, `feedback` (teacher_feedback), `createdAt`. В MVP без `score`; при необходимости — позже. | Никаких полей задания (config, type) — только ссылка на task. |

**Правило:** Task = что требует преподаватель. Submission = что отправил студент и как его оценили. Не смешивать.

### 1.2 Submission answer зависит от task.type

Ответ студента (`submission.answer`) **всегда** имеет структуру по типу задачи. Не универсальный `payload: {}` и не произвольный JSON.

| task.type | answer schema | Пример |
|-----------|---------------|--------|
| **QUIZ** | `{ selectedOption: number }` (0–3) | `{ "selectedOption": 2 }` |
| **AUDIO** | `{ audioUrl: string }` (s3:// или URL) | `{ "audioUrl": "s3://bucket/uploads/xxx.mp3" }` |
| **PHOTO** | `{ photoUrl: string }` (s3:// или URL) | `{ "photoUrl": "s3://bucket/uploads/xxx.jpg" }` |

**Правило:** Backend валидирует `answer` в зависимости от `task.type`. Иначе — 400. Нельзя отправить `photoUrl` в QUIZ или `selectedOption` в AUDIO.

### 1.3 Teacher flow и Student flow — разные экраны

| Роль | Экраны / действия | Не делать |
|------|-------------------|-----------|
| **Teacher** | Task create, Task details, Submission list, Submission review page (score + feedback). | Одна «универсальная» страница task + submit + review + edit. |
| **Student** | Lesson page с задачами, форма отправки ответа (textarea / upload), статус своей submission. | Доступ к списку чужих submissions, кнопка «Review». |

**Правило:** Разные use cases — разные UI и маршруты. Не комбайн на 400 строк условного рендера.

### 1.4 Политика попыток (зафиксирована для MVP)

- **Один студент — одна submission на один task.** Повторная отправка запрещена (DB: `UNIQUE(task_id, student_id)` + проверка в сервисе).
- **Review update policy:** повторный вызов PATCH `/submissions/:id/review` **разрешён** и трактуется как обновление существующего отзыва (status и feedback). Новая запись не создаётся; обновляется та же submission.
- Итого: submission создаётся один раз; review можно выставить один раз, затем при необходимости обновлять (status остаётся APPROVED/REJECTED, feedback можно менять).

---

## 2. Контракт API (Sprint 4)

### 2.1 Submit task (Student)

- **POST** `/api/v1/tasks/:id/submit`
- **Body:** см. Request bodies ниже. Поле `answer` обязательно; структура — строго по типу задачи.
- **Валидация:** task существует; пользователь — STUDENT; нет существующей submission для этого (task, student); `answer` соответствует `task.type`. Любое другое тело или лишние поля по типу → 400.
- **Response 201:** `{ id, status, createdAt }` (при необходимости — taskId).

### 2.2 Submit task — Request bodies (контракт запроса)

Единственный официальный контракт тела запроса. Для фронта и backend:

**QUIZ**

```json
{ "answer": { "selectedOption": 0 } }
```

- `selectedOption` — число 0..3, обязательно.
- Любые другие поля в `answer` или отсутствие `selectedOption` → 400.

**AUDIO**

```json
{ "answer": { "audioUrl": "s3://bucket/key" } }
```

- `audioUrl` — строка (s3:// или URL), обязательно.
- Любые другие поля в `answer` или отсутствие `audioUrl` → 400.

**PHOTO**

```json
{ "answer": { "photoUrl": "s3://bucket/key" } }
```

- `photoUrl` — строка (s3:// или URL), обязательно.
- Любые другие поля в `answer` или отсутствие `photoUrl` → 400.

На backend: отдельные Zod-схемы на каждый тип и выбор схемы по `task.type` перед валидацией.

### 2.3 List submissions

- **GET** `/api/v1/submissions`
  - **Student:** только свои (filter `studentId = currentUser`). Поля: id, taskId, status, createdAt (и при необходимости task title / lesson). Score — когда будет введён.
  - **Teacher/Admin:** как сейчас — teacher только по своим курсам, admin — все. Поля: id, taskId, studentId, status, createdAt, при необходимости task/lesson/course/student.

### 2.4 Get submission details

- **GET** `/api/v1/submissions/:id`
- **Response:** id, student (или studentId), task (или taskId + task details), answer (по типу: selectedOption / audioUrl / photoUrl), feedback (teacher_feedback), status, createdAt.
- Доступ: студент — только свои; teacher — только по своим курсам; admin — все.

### 2.5 Статусы submission (официальная семантика)

Используются **только** три значения enum. Параллельного языка «submitted/reviewed» как отдельных значений нет.

| Status   | Семантика |
|----------|-----------|
| **PENDING**  | Студент отправил решение; преподаватель ещё не проверил. |
| **APPROVED** | Проверено, принято. |
| **REJECTED** | Проверено, отклонено. |

После создания submission имеет статус PENDING (или сразу APPROVED/REJECTED для QUIZ при авто-проверке). После вызова review — APPROVED или REJECTED.

### 2.6 Final MVP review contract

Для Sprint 4 MVP review endpoint жёстко такой:

**PATCH** `/api/v1/submissions/:id/review`

**Body (application/json):**

```json
{
  "status": "APPROVED" | "REJECTED",
  "feedback": "optional string"
}
```

- `status` — обязательно `APPROVED` или `REJECTED`.
- `feedback` — опционально (в БД — `teacher_feedback`).

**Поле `score` в MVP отложено.** Текущий backend и фронт работают только с status + feedback. Добавление score (0–100) — после MVP, отдельным решением.

**Review update policy:** повторный PATCH на тот же `submissions/:id` разрешён. Обновляется та же запись (status и feedback). Новая submission не создаётся.

---

## 3. Текущее состояние backend и расхождения

| Элемент | Сейчас | Sprint 4 MVP |
|---------|--------|--------------|
| Submission status | PENDING, APPROVED, REJECTED | Без изменений; семантика зафиксирована выше. |
| Review DTO | status + teacherFeedback | **Контракт:** status + feedback. Совпадает. |
| Score | Нет поля | Отложено; в MVP не входит. |
| reviewed_at | Нет | Опционально позже. |
| Answer validation | Общий object; QUIZ в grader | Ввести явные схемы по task.type; иначе → 400. |
| GET /submissions для student | Нет фильтра по studentId | Добавить: для STUDENT возвращать только свои submissions. |

---

## 4. Итог

- **Правила 1–4** обязательны; **статусы** — только PENDING/APPROVED/REJECTED; **review MVP** — body `{ status, feedback? }`, повторный PATCH обновляет ту же запись.
- **Submit request bodies** — строго по типу задачи; иначе 400.
- **GET /submissions:** STUDENT — только свои; TEACHER/ADMIN — как сейчас.
- После Sprint 4 платформа закрывает цикл: course → module → lesson → task → submission → review.
