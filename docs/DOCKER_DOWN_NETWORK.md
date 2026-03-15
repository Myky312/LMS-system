# Docker: чистый старт и сеть "Resource is still in use"

## Быстрый чистый старт (рекомендуется)

Из корня репозитория:
```bash
./docker-clean-start.sh
```
Скрипт останавливает и удаляет все контейнеры и тома, подчищает зависшие контейнеры, затем поднимает весь стек (postgres, minio, backend, prometheus, grafana, **db-studio**). Drizzle Studio стартует вместе со всеми сервисами.

---

## Полная очистка вручную (старые тома, старые бакеты MinIO)

Чтобы MinIO и Postgres начали с пустого состояния (нужный бакет **zeekr-academy-media** создаст бэкенд при старте, старый **baitul-quran-media** исчезнет):

1. Остановить и удалить контейнеры, держащие сеть (если есть):
   ```bash
   docker ps -a --filter "network=zeekracademy_default" --format "{{.ID}} {{.Names}}"
   docker rm -f <ID>   # для каждого или: docker container prune -f
   ```

2. Остановить проект и **удалить тома** (в т.ч. MinIO и Postgres):
   ```bash
   docker compose down -v
   ```

3. Если сеть всё ещё не удаляется:
   ```bash
   docker network rm zeekracademy_default
   ```

4. Запустить заново:
   ```bash
   docker compose up -d
   ```

После этого в MinIO будет только бакет **zeekr-academy-media**, созданный бэкендом при старте.

---

## Сеть "Resource is still in use" после docker compose down

Если после `docker compose down -v` видишь:
```text
! Network zeekracademy_default  Resource is still in use
```
значит к сети ещё подключён какой-то контейнер (часто от `docker compose run db-studio`).

**Как исправить:**

1. Посмотреть контейнеры, использующие эту сеть:
   ```bash
   docker ps -a --filter "network=zeekracademy_default" --format "{{.ID}} {{.Names}}"
   ```

2. Удалить найденные контейнеры (подставь ID или имя):
   ```bash
   docker rm -f <CONTAINER_ID>
   ```
   Или удалить все остановленные контейнеры:
   ```bash
   docker container prune -f
   ```

3. Снова снять проект и удалить тома:
   ```bash
   docker compose down -v
   ```

4. Если сеть всё ещё не удаляется, удалить её вручную:
   ```bash
   docker network rm zeekracademy_default
   ```

После этого `docker compose up -d` создаст сеть заново.
