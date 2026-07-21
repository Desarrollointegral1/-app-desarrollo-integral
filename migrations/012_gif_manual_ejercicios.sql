-- ============================================================================
-- 012 — GIF manual por ejercicio (ronda 12, 2026-07-21)
--
-- Contexto: los GIFs de ejercicios se resuelven automáticamente por nombre
-- normalizado (src/utils/ejerciciosMedia.js → getEjercicioGif). Cuando el
-- nombre del ejercicio no matchea ningún GIF del catálogo (ej. nombre
-- distinto, ejercicio nuevo), Lucas necesita poder asociar un GIF a mano
-- desde el editor — tanto en la Biblioteca central como en Principales.
--
-- Se guarda en DOS lugares, igual que ya pasa con `video`:
--   1) biblioteca_ejercicios.gif — el maestro central (Admin → Biblioteca).
--   2) plan_ejercicios.gif — la copia puntual de CADA alumno en Principales
--      (igual que ya tiene su propia columna `video`/`codigo`).
-- Movilidad/Act. Elástico/Entrada en calor son arrays jsonb en `alumnos`
-- (plan_movilidad/plan_calor/plan_activacion) — no necesitan columna nueva,
-- el campo "gif" se suma directo a cada objeto del array (mismo patrón que
-- "video"/"mediaLocal"/"codigo" ya usan ahí).
-- ============================================================================

ALTER TABLE IF EXISTS biblioteca_ejercicios
ADD COLUMN IF NOT EXISTS gif text;

ALTER TABLE IF EXISTS plan_ejercicios
ADD COLUMN IF NOT EXISTS gif text;

-- Verificación
SELECT column_name FROM information_schema.columns
WHERE table_name = 'biblioteca_ejercicios' AND column_name = 'gif';

SELECT column_name FROM information_schema.columns
WHERE table_name = 'plan_ejercicios' AND column_name = 'gif';
