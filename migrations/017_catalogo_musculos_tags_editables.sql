-- ══════════════════════════════════════════════════════════════════════
-- 017: MÚSCULOS Y TAGS EDITABLES EN EL CATÁLOGO (punto 4, ronda 2026-07-21)
-- YA APLICADA vía MCP el 2026-07-21.
--
-- El dataset trae target/target_es (único) + secondary_muscles_es (array)
-- + equipment/equipment_es (único) — no pensados para editarse a mano.
-- Se agregan columnas NUEVAS para la edición desde la app, sin tocar las
-- originales (quedan como referencia del dataset):
--   - musculos: jsonb array de strings — TODOS los músculos trabajados
--     (target + secondary combinados). Si es null, la UI lo inicializa
--     desde target_es/secondary_muscles_es la primera vez que se edita.
--   - musculo_default: cuál de "musculos" es el principal (target).
--   - tags: jsonb array de strings — equipment + cualquier tag libre que
--     agregue el admin. Si es null, la UI lo inicializa desde
--     equipment_es.
--   - tag_default: cuál de "tags" es el predeterminado.
-- ══════════════════════════════════════════════════════════════════════

alter table catalogo_ejercicios add column if not exists musculos jsonb;
alter table catalogo_ejercicios add column if not exists musculo_default text;
alter table catalogo_ejercicios add column if not exists tags jsonb;
alter table catalogo_ejercicios add column if not exists tag_default text;
