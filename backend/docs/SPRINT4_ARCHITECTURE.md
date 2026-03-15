# Sprint 4 — Submissions + Review Flow: Architecture & Contract

Этот документ фиксирует **архитектурные правила** и **контракт** для полного цикла: task → student submits → teacher reviews → grade. Правила нельзя нарушать при доработках.

---

## 1. Четыре обязательных правила

### 1.1 Task и Submission строго разделены

| Сущность | Содержит | Не содержит |
|----------|----------|-------------|
| **Task** | `type`, `config`, `lessonId`. Требования задания (вопрос, опции, инструкции, maxDuration, requiredElements). | Никаких полей ответа студента: не `audioUrl`, не `photoUrl`, не `score`, не `feedback`, не `submittedAt`. |
| **Submission** | `taskId`, `studentId`, `answer`, `status`, `score`, `feedback`, `createdAt`, `reviewedAt`. | Никаких полей задания (config, type) — только ссылка на task. |

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
- **Review выполняется один раз.** После перехода в статус «reviewed» (APPROVED/REJECTED) повторный PATCH на review может быть либо запрещён, либо явно трактоваться как **обновление** существующего отзыва (score + feedback), без создания новой записи.
- Текущая реализация: только PENDING можно отправить на review; после review обновление той же submission через PATCH не создаёт новую запись.

---

## 2. Контракт API (Sprint 4)

### 2.1 Submit task (Student)

- **POST** `/api/v1/tasks/:id/submit`
- **Body:** зависит от типа задачи (см. answer schemas ниже).
- **Валидация:** task существует; пользователь — STUDENT; нет существующей submission для этого (task, student); `answer` соответствует `task.type`.
- **Response 201:** `{ id, status, createdAt }` (при необходимости — taskId, score: null до review).

### 2.2 Submission answer schemas (backend и frontend)

При отправке `POST /tasks/:id/submit` тело должно быть таким:

**QUIZ:**

```ts
{ "answer": { "selectedOption": 0 } }  // 0..3
```

**AUDIO:**

```ts
{ "answer": { "audioUrl": "s3://bucket/key" } }
```

**PHOTO:**

```ts
{ "answer": { "photoUrl": "s3://bucket/key" } }
```

Рекомендация: на backend — отдельные Zod-схемы на каждый тип и выбор схемы по `task.type` перед валидацией.

### 2.3 List submissions

- **GET** `/api/v1/submissions`
  - **Student:** только свои (filter `studentId = currentUser`). Поля: id, taskId, status, score, createdAt (и при необходимости task title / lesson).
  - **Teacher/Admin:** как сейчас — teacher только по своим курсам, admin — все. Поля: id, taskId, studentId, status, score, createdAt, при необходимости task/lesson/course/student.

### 2.4 Get submission details

- **GET** `/api/v1/submissions/:id`
- **Response:** id, student (или studentId), task (или taskId + task details), answer (textAnswer/fileUrl или по типу: selectedOption / audioUrl / photoUrl), score, feedback, status, createdAt, reviewedAt.
- Доступ: студент — только свои; teacher — только по своим курсам; admin — все.

### 2.5 Review submission (Teacher)

- **PATCH** `/api/v1/submissions/:id/review`
- **Body:** `{ score: number, feedback?: string }`
  - `score`: 0–100 (или явная шкала, зафиксированная в контракте).
  - `feedback`: опционально.
- **Логика:** status → reviewed (или APPROVED/REJECTED в зависимости от выбранной семантики); `reviewed_at = now()`; обновление существующей записи, не создание новой.
- Текущий backend: использует `status` (APPROVED/REJECTED) и `teacherFeedback`. Для Sprint 4 можно добавить поле `score` (0–100) и при необходимости маппинг status ↔ «reviewed».

---

## 3. Текущее состояние backend и расхождения

| Элемент | Сейчас | По контракту Sprint 4 |
|---------|--------|------------------------|
| Submission status | PENDING, APPROVED, REJECTED | «submitted» = факт отправки (у нас — запись создаётся со статусом PENDING); «reviewed» = после review (APPROVED/REJECTED). Семантика совпадает. |
| Score | Нет поля | Добавить `score` (0–100) в таблицу и в DTO review. |
| Feedback | `teacher_feedback` | Оставить; в API можно именовать `feedback`. |
| reviewed_at | Нет | Опционально добавить для аналитики. |
| Answer validation | Общий object; QUIZ проверяется в grader | Ввести явные схемы по task.type и валидировать answer до сохранения. |
| GET /submissions для student | Нет отдельного фильтра | Добавить: для роли STUDENT возвращать только submission текущего пользователя. |

---

## 4. Итог

- **Правила 1–4** обязательны: разделение Task/Submission, типизированный answer по типу задачи, раздельные teacher/student экраны, фиксированная политика попыток.
- **Контракт** (answer schemas, score, feedback, список для студента) — единый для backend и frontend; доработки backend (score, валидация answer, student list) выполняются в рамках Sprint 4.
- После Sprint 4 платформа закрывает цикл: course → module → lesson → task → submission → review.
