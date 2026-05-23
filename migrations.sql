-- ====================================
-- MIGRACIONES: App Desarrollo Integral
-- Tablas necesarias para arquitectura simplificada
-- ====================================

-- 1. Limpiar tablas antiguas complejas (OPCIONAL - solo si quieres empezar de cero)
-- DROP TABLE IF EXISTS alumno_planes CASCADE;
-- DROP TABLE IF EXISTS plan_dias CASCADE;
-- DROP TABLE IF EXISTS plan_ejercicios CASCADE;

-- 2. Tabla ENTRENAMIENTOS (nueva)
-- Estructura de días de entrenamiento por alumno
CREATE TABLE IF NOT EXISTS entrenamientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id TEXT NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  numero_dia INT NOT NULL, -- 1, 2, 3, etc
  tipo_plan TEXT NOT NULL CHECK (tipo_plan IN ('bilateral', 'unilateral')),
  ejercicios JSONB NOT NULL DEFAULT '[]', -- [{id: 'hombro', nombre: 'Hombro', personalizado: false}, ...]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(alumno_id, numero_dia)
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_entrenamientos_alumno_id ON entrenamientos(alumno_id);
CREATE INDEX IF NOT EXISTS idx_entrenamientos_numero_dia ON entrenamientos(numero_dia);

-- 3. Tabla REGISTROS_DIARIOS (nueva - CORE de la app)
-- Registro diario: presencia, pesos, comentario
CREATE TABLE IF NOT EXISTS registros_diarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id TEXT NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  numero_dia_entrenamiento INT, -- Qué día de entrenamiento fue (1, 2, 3, etc)
  presente BOOLEAN DEFAULT false,
  comentario TEXT,
  pesos JSONB DEFAULT '{}', -- {hombro: 25, dom_rodilla: 100, pecho: 50, ...}
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(alumno_id, fecha)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_registros_diarios_alumno_id ON registros_diarios(alumno_id);
CREATE INDEX IF NOT EXISTS idx_registros_diarios_fecha ON registros_diarios(fecha);
CREATE INDEX IF NOT EXISTS idx_registros_diarios_alumno_fecha ON registros_diarios(alumno_id, fecha);

-- 4. Tabla BIOIMPEDANCIA (nueva)
-- Registros de análisis corporal por alumno
CREATE TABLE IF NOT EXISTS bioimpedancia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id TEXT NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  grasa_corporal NUMERIC(5,2), -- %
  masa_muscular NUMERIC(5,2), -- %
  peso NUMERIC(6,2), -- kg
  agua NUMERIC(5,2), -- %
  nota TEXT,
  archivo_url TEXT, -- URL del archivo subido (si aplica)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(alumno_id, fecha)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bioimpedancia_alumno_id ON bioimpedancia(alumno_id);
CREATE INDEX IF NOT EXISTS idx_bioimpedancia_fecha ON bioimpedancia(fecha);

-- 5. EJERCICIOS FIJOS (Constante - estos son los 6 principales)
-- No necesitan tabla, son hardcodeados en la app:
-- - hombro (Hombro)
-- - dom_rodilla (Dominante de Rodilla)
-- - pecho (Pecho)
-- - dom_cadera (Dominante de Cadera)
-- - espalda (Espalda)
-- - gluteos (Glúteos)

-- 6. Actualizar tabla ALUMNOS si es necesario
-- Eliminar campos innecesarios (plan_movilidad, plan_calor, etc)
-- Opcionalmente: ALTER TABLE alumnos DROP COLUMN plan_movilidad CASCADE;
-- Pero es mejor dejarlo así para compatibilidad

-- DONE: Ejecuta este SQL en Supabase Dashboard → SQL Editor
-- Copia todo este contenido y pega en el editor, luego haz clic en "Run"
