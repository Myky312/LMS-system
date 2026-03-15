-- ZeekrAcademy: seed teacher (password: zeekrteacher). Safe to re-run: ON CONFLICT DO NOTHING.
INSERT INTO "users" ("id", "email", "password_hash", "role", "created_at")
VALUES (
  gen_random_uuid(),
  'teacher@zeekracademy.com',
  '$2b$10$KbDqR2fi3olW7L.mc0twyOaxJMpdEXRSi57P6.Xn0onebmgaZqI62',
  'TEACHER',
  now()
)
ON CONFLICT ("email") DO NOTHING;
