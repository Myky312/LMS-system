# Backend Contract Report — ZeekrAcademy Frontend Phase 1

Документ составлен по коду backend и README. Используется фронтом для согласования payload и endpoints.

**Рекомендация:** перед изменениями в API или новыми фичами сверять с живым Swagger (`http://localhost:3000/api/docs`) и при расхождении обновлять этот отчёт.

---

## 1. Base URLs

| Что | Значение |
|-----|----------|
| API base | `http://localhost:3000/api/v1` (или `NEXT_PUBLIC_API_URL`) |
| Swagger | `http://localhost:3000/api/docs` |
| Auth | Stateless JWT, **Bearer** в заголовке `Authorization` |

---

## 2. Auth

### Endpoints

| Method | Path | Описание |
|--------|------|----------|
| POST | `/auth/login` | Логин (throttle: 5 req/60s) |
| POST | `/auth/refresh` | Обновление access token |
| POST | `/auth/logout` | Клиент просто забывает токены; сервер ничего не инвалидирует |

### Login

- **Request:** `application/json`
  ```json
  { "email": "user@example.com", "password": "password123" }
  ```
  - `email` — строка, валидный email
  - `password` — строка, min 6 символов

- **Response 200:** body (не cookie)
  ```json
  {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": "uuid", "email": "user@example.com", "role": "TEACHER" }
  }
  ```
  - Токены и пользователь приходят **в body**. Cookies не используются.
  - Роли: `ADMIN` | `TEACHER` | `STUDENT`

- **Response 401:** Invalid credentials (единое сообщение для неверный email/пароль).

### Refresh

- **Request:** `application/json`
  ```json
  { "refreshToken": "eyJ..." }
  ```

- **Response 200:** тот же shape, что и login (новая пара `accessToken`, `refreshToken`, `user`).

- **Response 401:** Invalid refresh token / user not found.

### Токены и запросы

- **Текущая реализация фронта (зафиксирована):**
  - **Access token:** в памяти + дублируется в `sessionStorage` (fallback после перезагрузки до первого refresh).
  - **Refresh token:** в `localStorage`.
  - Сервер токены не хранит; все защищённые запросы — заголовок `Authorization: Bearer <accessToken>`.
- **Swagger:** в конфиге указан Bearer auth с именем `JWT-auth`.

### Current user

- Отдельного endpoint’а **`/me` или `/auth/me` нет**. Пользователь берётся только из ответов `login` и `refresh` (`user`: id, email, role).
- **Поведение после перезагрузки страницы:**
  - Если access token потерян, но refresh token есть → фронт один раз вызывает `POST /auth/refresh`; при успехе сохраняет новую пару токенов и `user` в session state.
  - Если refresh невалиден или запрос refresh вернул 401 → очистка сессии (clear tokens + user) и редирект на `/login`.
- JWT payload на клиенте можно использовать только для отображения; проверку доступа выполняет сервер по JWT.

---

## 3. Роли и ownership

| Роль | На этом фронте (admin/teacher panel) |
|------|--------------------------------------|
| ADMIN | Полный доступ: все курсы, все submissions. |
| TEACHER | Только свои курсы; создание module/lesson/task только в своих курсах; review только по своим курсам. |
| STUDENT | В panel не пускать или показывать 403 / no access. |

- 401 — не авторизован (нет/невалидный токен).
- 403 — нет прав (например, teacher открыл чужой course).

---

## 4. Courses

### Endpoints (реально есть в коде)

| Method | Path | Роли | Описание |
|--------|------|------|----------|
| POST | `/courses` | TEACHER, ADMIN | Создать курс |
| GET | `/courses` | Все (ответ фильтруется по роли) | Список курсов |
| GET | `/courses/:id` | Все (ownership для TEACHER) | Детали курса |

- **Update (PATCH/PUT) и Delete в контроллере не найдены.** В `CoursesService` есть метод `softDelete`, но HTTP endpoint для него не зарегистрирован. Для полного CRUD на бэкенде нужно добавить, например:
  - `PATCH /courses/:id`
  - `DELETE /courses/:id`

### Create course

- **Request:** `application/json`
  ```json
  { "title": "Introduction to Quran", "description": "Learn the basics..." }
  ```
  - `title` — строка, min 1 символ
  - `description` — строка, optional

- **Response 201:** объект курса. Точный shape (id, title, description, createdBy, createdAt, …) — проверить по Swagger или реальному ответу.

### List courses

- **Response 200:** массив курсов. ADMIN — все неудалённые; TEACHER — только свои; STUDENT — все неудалённые (для будущего student app).

### Get course

- **Response 200:** один курс.
- **Response 404:** Course not found.
- **Response 403:** You can only access your own courses (TEACHER открыл чужой курс).

---

## 5. Modules

### Endpoints

| Method | Path | Роли | Описание |
|--------|------|------|----------|
| POST | `/courses/:courseId/modules` | TEACHER, ADMIN | Создать модуль |
| GET | `/courses/:courseId/modules` | — | Список модулей курса |
| GET | `/courses/:courseId/modules/:id` | — | Детали модуля (в коде путь `:id`) |

Update/Delete в контроллере не просматривались — при необходимости проверить Swagger и сервисы.

### Create module

- **Request:** `application/json`
  ```json
  { "title": "Module 1: Basics" }
  ```
  - `title` — строка, min 1
  - `orderIndex` — optional; если не передан, бэк ставит модуль в конец (max + 1).
- **Фронт:** форма создания модуля **не содержит** orderIndex; только title. Backend сам кладёт новый элемент в конец.

- **Response 201:** объект модуля. Точный shape (id, courseId, title, orderIndex, …) — проверить по Swagger или реальному ответу.
- **Response 403:** Not authorized to create module in this course.

### Reorder modules

- **PATCH** `/courses/:courseId/modules/reorder` (TEACHER, ADMIN)
- **Request:** `application/json`
  ```json
  { "items": [ { "id": "module-uuid-1", "orderIndex": 0 }, { "id": "module-uuid-2", "orderIndex": 1 } ] }
  ```
  - Все `id` должны принадлежать данному курсу; иначе 400.
- **Response 200:** body — обновлённый список модулей курса (массив, тот же shape что GET list). Не 204, не message-only; фронт может использовать ответ для обновления кэша при необходимости.

---

## 6. Lessons

### Endpoints

| Method | Path | Роли | Описание |
|--------|------|------|----------|
| POST | `/modules/:moduleId/lessons` | TEACHER, ADMIN | Создать урок |
| GET | `/modules/:moduleId/lessons` | — | Список уроков |
| GET | `/modules/:moduleId/lessons/:id` | — | Детали урока |

### Create lesson

- **Request:** `application/json`
  ```json
  { "title": "Lesson 1: Introduction", "videoUrl": "https://example.com/video.mp4" }
  ```
  - `title` — строка, min 1
  - `videoUrl` — строка, URL, optional
  - `orderIndex` — optional; если не передан, бэк ставит урок в конец (max + 1).
- **Фронт:** форма создания урока **не содержит** orderIndex; только title и videoUrl. Backend сам кладёт новый элемент в конец.

- **Response 201:** объект урока. Точный shape (id, moduleId, title, videoUrl, orderIndex, …) — проверить по Swagger или реальному ответу.

### Reorder lessons

- **PATCH** `/modules/:moduleId/lessons/reorder` (TEACHER, ADMIN)
- **Request:** `application/json`
  ```json
  { "items": [ { "id": "lesson-uuid-1", "orderIndex": 0 }, { "id": "lesson-uuid-2", "orderIndex": 1 } ] }
  ```
  - Все `id` должны принадлежать данному модулю; иначе 400.
- **Response 200:** body — обновлённый список уроков модуля (массив, тот же shape что GET list). Не 204, не message-only; фронт может использовать ответ для обновления кэша при необходимости.

---

## 7. Tasks

### Endpoints

| Method | Path | Роли | Описание |
|--------|------|------|----------|
| POST | `/lessons/:lessonId/tasks` | TEACHER, ADMIN | Создать задание |
| GET | `/lessons/:lessonId/tasks` | — | Список заданий |
| GET | `/lessons/:lessonId/tasks/:id` | — | Детали задания |

### Create task (polymorphic)

- **Request:** `application/json`
  ```json
  { "type": "QUIZ", "config": { ... } }
  ```
  - `type`: `QUIZ` | `AUDIO` | `PHOTO`
  - `config` — по типу (см. ниже)

**QUIZ config (backend validator):**

- `question` — строка, min 1
- `options` — массив ровно **4** строки (каждая min 1 символ)
- `correctAnswer` — число 0..3 (индекс правильного варианта)

**AUDIO config:**

- `instructions` — строка, optional
- `maxDuration` — целое положительное (секунды), optional

**PHOTO config:**

- `instructions` — строка, optional
- `requiredElements` — массив строк (каждая min 1), optional

- **Response 201:** объект задачи. Точный shape (id, lessonId, type, config, …) — проверить по Swagger или реальному ответу.
- **Response 400:** Invalid task config (в т.ч. Zod errors в body).
- **Response 403:** Not authorized to create task in this lesson.

---

## 8. Submissions

### Endpoints

| Method | Path | Роли | Описание |
|--------|------|------|----------|
| POST | `/tasks/:id/submit` | STUDENT | Отправить решение (для student app) |
| GET | `/submissions` | TEACHER, ADMIN | Список submissions |
| GET | `/submissions/:id` | TEACHER, ADMIN (ownership для TEACHER) | Детали |
| PATCH | `/submissions/:id/review` | TEACHER, ADMIN | Ревью (approve/reject) |

### List submissions

- **Query:** `status` — optional, enum: PENDING | APPROVED | REJECTED.
- **Response 200:** массив submission. TEACHER — только по своим курсам; ADMIN — все. Точные поля элементов списка (task title, student email и т.д.) — проверить по Swagger или реальному ответу.

### Get submission

- **Response 200:** один submission. Точный shape (id, taskId, studentId, answer, status, teacherFeedback, createdAt, …) — проверить по Swagger или реальному ответу.
- **Response 404:** Submission not found.

### Review submission

- **Request:** `application/json`
  ```json
  { "status": "APPROVED", "feedback": "Good pronunciation!" }
  ```
  - `status` — обязательно `APPROVED` или `REJECTED`
  - `feedback` — строка, optional (в БД — teacher_feedback)

- **Response 200:** обновлённый submission.
- **Response 403:** Not authorized to review this submission.

---

## 9. Media

### Presign

| Method | Path | Роли | Описание |
|--------|------|------|----------|
| POST | `/media/presign` | JWT (любая авторизованная роль) | Получить presigned URL для загрузки в S3 |

- **Request:** `application/json`
  ```json
  { "fileName": "audio-recording.mp3", "contentType": "audio/mpeg" }
  ```
  - `fileName` — строка, min 1
  - `contentType` — строка, min 1 (MIME type)

- **Response 200:** объект с `uploadUrl` и `fileUrl`.
  - `uploadUrl` — PUT с телом файла на этот URL.
  - `fileUrl` — значение для сохранения в lesson.videoUrl / task answer (audioUrl/photoUrl). **Точный формат (key vs full URL) не подтверждён в текущей доке — необходимо проверить по бэкенду/Swagger.**

---

## 10. Errors

Общий формат (из `AllExceptionsFilter`):

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "errors": null,
  "timestamp": "2025-03-15T12:00:00.000Z"
}
```

- При валидации Zod `errors` может быть массивом (например, `errors` из Zod issues). `message` может быть строкой или массивом (Nest по разному отдаёт).
- Коды: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity (валидация).

---

## 11. Known backend gaps

| Проблема | Состояние |
|----------|-----------|
| `PATCH /courses/:id` | Отсутствует в контроллере; edit course на фронте заблокирован. |
| `DELETE /courses/:id` | Отсутствует в контроллере (в сервисе есть softDelete без HTTP). |
| Update/delete для modules, lessons, tasks | В коде контроллеров не просматривались; наличие проверить по Swagger/бэкенду. |
| `/auth/me` | Отсутствует; current user только из login/refresh и session state. |
| Presign `fileUrl` shape | Точный формат (key vs full URL) не подтверждён — проверить по бэкенду. |
| Submission list item shape | Точные поля элементов списка — проверить по реальному ответу. |

---

## 12. Swagger vs реальность — что проверить

1. **Courses/Modules/Lessons/Tasks:** наличие PATCH/DELETE в Swagger; при отсутствии — на фронте только list/create/detail до появления endpoint.
2. **Presign response:** точный вид `fileUrl` и куда его подставлять.
3. **Submission list:** точные поля элементов.
4. **JWT:** в Swagger указан Bearer; cookies не используются.

---

## 13. Итог для фронта

- **Auth:** login/refresh возвращают `accessToken`, `refreshToken`, `user` в body. Защищённые запросы: `Authorization: Bearer <accessToken>`.
- **Current user:** из login/refresh; отдельного `/me` нет.
- **Иерархия:** course → module → lesson → task; создание только по цепочке (module в course, lesson в module, task в lesson).
- **Ownership:** TEACHER видит и правит только свои курсы и контент по ним; 403 при доступе к чужому.
- **CRUD:** гарантированно есть create + list + get для courses, modules, lessons, tasks; update/delete для content — см. Known backend gaps; при отсутствии endpoint на фронте только заглушки или скрытые кнопки.
- **Submissions:** list (с фильтром status), get, review (PATCH с status + feedback).
- **Media:** presign → загрузка файла на `uploadUrl` → сохранение `fileUrl` в нужное поле.
- **Ошибки:** единый JSON с `statusCode`, `message`, `errors`, `timestamp`.
