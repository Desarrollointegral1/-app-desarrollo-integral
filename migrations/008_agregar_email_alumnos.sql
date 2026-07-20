-- 008: Agregar columna email a alumnos
-- Permite guardar el email del alumno para poder mandarle más adelante
-- el usuario y clave de acceso. No implementa el envío de mail, solo el
-- guardado del dato (pedido de Lucas 2026-07-19).

ALTER TABLE IF EXISTS alumnos
ADD COLUMN IF NOT EXISTS email text;

-- DONE: Ejecuta este SQL en Supabase Dashboard → SQL Editor
-- (https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj/sql)
-- Copia todo este contenido y pega en el editor, luego haz clic en "Run".
