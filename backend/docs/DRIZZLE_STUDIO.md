# Drizzle Studio (Docker)

1. **Запуск с пробросом порта** (обязательно `--service-ports`):
   ```bash
   cd /Users/myktybeksattarov/Desktop/ZeekrAcademy
   docker compose run --service-ports --rm db-studio
   ```
   Или из backend: `pnpm run db:studio:docker`

2. Открой в браузере: **https://local.drizzle.studio**

3. **Chrome блокирует доступ к localhost** — нужно разрешить:
   - На странице local.drizzle.studio нажми на **значок замка** (или «i») в адресной строке слева от URL.
   - Найдите пункт **«Local network access»** / **«Доступ к локальной сети»**.
   - Переключите на **«Allow»** / **«Разрешить»**.
   - Обновите страницу (F5 или Cmd+R).

4. Проверка, что порт открыт:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4983
   ```
   Должен вернуться код (не 000). Если 000 — перезапустите контейнер с `--service-ports`.
