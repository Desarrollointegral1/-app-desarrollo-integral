-- ============================================================
-- FIX: alinear schema de la app de gestión con el código
-- ============================================================
-- El código (services/supabase.js) escribe y lee columnas que no
-- existen en las tablas actuales. Síntomas en la app:
--   - "Could not find the 'dia' column of 'plan_dias'" (PGRST204)
--   - Días de plan sin nombre (el código lee d.dia, la tabla tiene nombre)
--   - Planes por día de semana imposibles de crear
-- Verificado contra el schema vivo el 2026-07-08. Idempotente:
-- se puede correr más de una vez sin errores.
-- ============================================================

-- 1. plan_dias — el código usa 'dia' y 'subtitulo'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='plan_dias' AND column_name='nombre')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='plan_dias' AND column_name='dia') THEN
    ALTER TABLE plan_dias RENAME COLUMN nombre TO dia;
  END IF;
END $$;

ALTER TABLE plan_dias ADD COLUMN IF NOT EXISTS subtitulo TEXT DEFAULT '';

-- El flujo "planes por día de semana" inserta filas con alumno_plan_id
-- pero SIN alumno_id — el NOT NULL actual lo rompe
ALTER TABLE plan_dias ALTER COLUMN alumno_id DROP NOT NULL;

-- 2. alumno_planes — el código usa 'nombre' y 'dia_semana'
ALTER TABLE alumno_planes ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE alumno_planes ADD COLUMN IF NOT EXISTS dia_semana TEXT;

-- 3. Recargar el caché de schema de la API
NOTIFY pgrst, 'reload schema';
