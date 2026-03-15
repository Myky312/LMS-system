-- Seed default admin user for ZeekrAcademy (email: admin@zeekracademy.com, password: zeekradmin)
-- Safe to re-run: ON CONFLICT DO NOTHING
INSERT INTO "users" ("id", "email", "password_hash", "role", "created_at")
VALUES (
  gen_random_uuid(),
  'admin@zeekracademy.com',
  -- password: zeekradmin
  '$2b$10$1Sk2J2qrVQL45oFBgryNy.ZP43g/tGI4gowRFhbBaRPTpwt1QmKAq',
  'ADMIN',
  now()
)
ON CONFLICT ("email") DO NOTHING;
