-- ══════════════════════════════════════════════════════════════════════
-- 021 — Ronda 18 (2026-07-21): archivar + nivel
--   · catalogo_ejercicios.archivado  → boolean, default false. Un
--     ejercicio archivado no aparece más en listados/búsquedas de la
--     Biblioteca (hay un toggle "mostrar archivados" para recuperarlo).
--   · catalogo_ejercicios.nivel      → text: 'inicial' | 'intermedio' |
--     'avanzado' (null = sin nivel). Editable en el detalle, visible como
--     badge en la card y filtrable en el sidebar.
--   · planes_predeterminados.nivel   → text, mismo dominio. Campo "Nivel"
--     del panel de armado de plan (junto a Nombre y Categoría/grupo).
-- Aplicada en Supabase el 2026-07-21 vía MCP (apply_migration).
-- ══════════════════════════════════════════════════════════════════════
ALTER TABLE catalogo_ejercicios ADD COLUMN IF NOT EXISTS archivado boolean NOT NULL DEFAULT false;
ALTER TABLE catalogo_ejercicios ADD COLUMN IF NOT EXISTS nivel text;
ALTER TABLE planes_predeterminados ADD COLUMN IF NOT EXISTS nivel text;
