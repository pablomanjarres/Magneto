-- A profile can be stored before its name or e-mail is known: "Crear perfil
-- nuevo" starts from an empty one. UNIQUE still holds, and allows many NULLs.

ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;
