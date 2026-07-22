-- 022 · Protocolo de evaluación (batería simple por alumno)
-- Tabla nueva `evaluaciones`: una fila por evaluación que el admin le hace a un
-- alumno. El detalle (escalas 1-5, checkboxes, notas) vive en la columna jsonb
-- `datos` para no atarse a un esquema rígido — mismo criterio que bioimpedancia.metadata.
-- Nivel y objetivo se suben a columnas propias para poder mostrarlos/filtrarlos rápido.
-- RLS abierto a la anon key, igual que el resto de las tablas de datos hoy (ver 003/006).

CREATE TABLE IF NOT EXISTS evaluaciones (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id  uuid NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  fecha      date NOT NULL DEFAULT CURRENT_DATE,
  evaluador  text,
  nivel      text,        -- principiante | intermedio | avanzado
  objetivo   text,        -- salud | bajar_grasa | ganar_musculo | rendimiento | rehabilitacion
  datos      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_alumno ON evaluaciones(alumno_id);

ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "anon_insert_evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "anon_update_evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "anon_delete_evaluaciones" ON evaluaciones;

CREATE POLICY "anon_select_evaluaciones" ON evaluaciones FOR SELECT TO public USING (true);
CREATE POLICY "anon_insert_evaluaciones" ON evaluaciones FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "anon_update_evaluaciones" ON evaluaciones FOR UPDATE TO public USING (true);
CREATE POLICY "anon_delete_evaluaciones" ON evaluaciones FOR DELETE TO public USING (true);
