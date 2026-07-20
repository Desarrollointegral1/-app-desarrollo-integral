-- 009: Agregar columna modalidad a alumnos
-- Guarda cómo entrena el alumno: "Presencial con Lucas", "Presencial con Ariel",
-- "Entrena solo en Desarrollo Integral" o "A distancia".
-- La app tolera que esta columna no exista (fallback en services/supabase.js),
-- pero hasta que corras esta migración la modalidad NO se guarda en la base.
-- (Pedido de Lucas 2026-07-20.)

ALTER TABLE IF EXISTS alumnos
ADD COLUMN IF NOT EXISTS modalidad text;

-- TODO: Ejecuta este SQL en Supabase Dashboard → SQL Editor
-- (https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj/sql)
-- Copia todo este contenido y pega en el editor, luego haz clic en "Run".
