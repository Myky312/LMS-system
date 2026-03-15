-- Only for a non-Docker Postgres (e.g. Homebrew). Do NOT use when localhost:5432 is Docker zeekr-postgres.
-- Usage: psql -U postgres -h 127.0.0.1 -f docs/init-local-postgres.sql
-- If role/DB already exist, ignore "already exists" errors.

CREATE ROLE zeekr_user WITH LOGIN PASSWORD 'zeekr_pass';

CREATE DATABASE zeekracademy OWNER zeekr_user;
CREATE DATABASE zeekracademy_test OWNER zeekr_user;

GRANT ALL PRIVILEGES ON DATABASE zeekracademy TO zeekr_user;
GRANT ALL PRIVILEGES ON DATABASE zeekracademy_test TO zeekr_user;

\echo 'Done. zeekr_user and DBs zeekracademy, zeekracademy_test are ready.'
