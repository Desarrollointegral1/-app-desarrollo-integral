-- ══════════════════════════════════════════════════════════════════════
-- 025 — Tag "REVISAR" (2026-07-30)
--   · catalogo_ejercicios.revisar → boolean, default false. Bandeja de
--     pendientes: cuando Lucas ve un ejercicio con el GIF equivocado, el
--     nombre mal o el código mal, lo tira acá desde el detalle y el chip
--     "Para revisar (N)" de la Biblioteca lo lista para arreglarlo después.
--     A diferencia de `archivado`, un ejercicio marcado NO se oculta de los
--     listados — sigue usable, solo queda marcado.
--   · Índice parcial: la única consulta es "traeme los marcados" (unas
--     decenas sobre 1.343 filas), no hace falta indexar los false.
-- APLICADA en producción el 2026-07-30. Al aplicarla se marcaron además los
-- 17 ejercicios que quedaron sin GIF (9 que nunca tuvieron + 8 a los que se
-- les sacó un GIF que no correspondía al movimiento).
-- ══════════════════════════════════════════════════════════════════════
ALTER TABLE catalogo_ejercicios ADD COLUMN IF NOT EXISTS revisar boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS catalogo_ejercicios_revisar_idx ON catalogo_ejercicios (id) WHERE revisar;
