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
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
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
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
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
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME,
  peso NUMERIC(6,2), -- kg
  grasa_corporal NUMERIC(5,2), -- %
  masa_muscular NUMERIC(5,2), -- %
  agua NUMERIC(5,2), -- %
  grasa_visceral NUMERIC(5,2), -- unidades
  imc NUMERIC(5,2), -- índice de masa corporal
  altura INT, -- cm
  edad INT, -- años
  nota TEXT,
  archivo_url TEXT, -- URL del archivo subido (si aplica)
  nombre_archivo TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agregar columnas que podrían faltar si la tabla ya existe
ALTER TABLE IF EXISTS bioimpedancia
ADD COLUMN IF NOT EXISTS alumno_id UUID,
ADD COLUMN IF NOT EXISTS hora TIME,
ADD COLUMN IF NOT EXISTS peso NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS grasa_corporal NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS masa_muscular NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS agua NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS grasa_visceral NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS imc NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS altura INT,
ADD COLUMN IF NOT EXISTS edad INT,
ADD COLUMN IF NOT EXISTS nota TEXT,
ADD COLUMN IF NOT EXISTS archivo_url TEXT,
ADD COLUMN IF NOT EXISTS nombre_archivo TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Crear índice para búsquedas rápidas (permite múltiples registros por día si hay diferentes horas)
CREATE INDEX IF NOT EXISTS idx_bioimpedancia_alumno_fecha_hora
ON bioimpedancia(alumno_id, fecha DESC, hora DESC);

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

-- 5.5. Agregar columnas a tabla ALUMNOS
-- Para almacenar el tipo de plan asignado globalmente al alumno
ALTER TABLE IF EXISTS alumnos
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'bilateral' CHECK (plan_type IN ('bilateral', 'unilateral')),
ADD COLUMN IF NOT EXISTS fecha_asignacion_plan TIMESTAMPTZ DEFAULT NOW();

-- 6. Tabla REPORTE_MENSUAL (opcional - para caché de reportes)
-- Vista materializada para reportes mensuales rápidos
CREATE TABLE IF NOT EXISTS reporte_mensual_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  mes DATE NOT NULL, -- Primer día del mes (YYYY-MM-01)
  total_asistencias INT DEFAULT 0,
  total_dias_entrenamiento INT DEFAULT 0,
  pesos_promedio JSONB DEFAULT '{}', -- {ejercicio: promedio_peso, ...}
  ultima_bioimpedancia JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(alumno_id, mes)
);

CREATE INDEX IF NOT EXISTS idx_reporte_mensual_alumno_mes
ON reporte_mensual_cache(alumno_id, mes DESC);

-- 7. EJERCICIOS FIJOS (Constante - estos son los 6 principales)
-- No necesitan tabla, son hardcodeados en la app:
-- - hombro (Hombro)
-- - dom_rodilla (Dominante de Rodilla)
-- - pecho (Pecho)
-- - dom_cadera (Dominante de Cadera)
-- - espalda (Espalda)
-- - gluteos (Glúteos)

-- 8. Actualizar tabla ALUMNOS si es necesario
-- Eliminar campos innecesarios (plan_movilidad, plan_calor, etc)
-- Opcionalmente: ALTER TABLE alumnos DROP COLUMN plan_movilidad CASCADE;
-- Pero es mejor dejarlo así para compatibilidad

-- DONE: Ejecuta este SQL en Supabase Dashboard → SQL Editor
-- Copia todo este contenido y pega en el editor, luego haz clic en "Run"
