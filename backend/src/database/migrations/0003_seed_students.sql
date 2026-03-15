-- ZeekrAcademy: seed students (password: zeekrstudent). Safe to re-run: ON CONFLICT DO NOTHING.
INSERT INTO "users" ("id", "email", "password_hash", "role", "created_at")
VALUES
  (gen_random_uuid(), 'student1@zeekracademy.com', '$2b$10$HU0IXXdsOip/MK3zYQZ8du6ZAHaSZoGDsfL2qm9RqyIxik/367Cx.', 'STUDENT', now()),
  (gen_random_uuid(), 'student2@zeekracademy.com', '$2b$10$HU0IXXdsOip/MK3zYQZ8du6ZAHaSZoGDsfL2qm9RqyIxik/367Cx.', 'STUDENT', now()),
  (gen_random_uuid(), 'student3@zeekracademy.com', '$2b$10$HU0IXXdsOip/MK3zYQZ8du6ZAHaSZoGDsfL2qm9RqyIxik/367Cx.', 'STUDENT', now())
ON CONFLICT ("email") DO NOTHING;
