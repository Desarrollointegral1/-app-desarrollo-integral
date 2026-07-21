-- 020 — Códigos para todo el catálogo de ejercicios (punto 9, 2026-07-21)
-- ═══════════════════════════════════════════════════════════════════
-- ✅ YA APLICADA en Supabase (tlxkghpytznkxgqslqzj) vía MCP apply_migration.
--    Este archivo queda versionado solo como registro — NO hay que correrla
--    de nuevo (WHERE codigo_di IS NULL la hace idempotente igual, pero no
--    hace falta: 0 filas sin código, 0 códigos duplicados, verificado).
--
-- Mapping completo de prefijos documentado en:
--   data/catalogo-codigos-prefijos.md
--
-- Resumen: los ~50 "Principales DI" (PH/RO/PE/CA/JA/GL/CO) ya tenían
-- codigo_di asignado a mano por Lucas como patrones de movimiento — no se
-- tocan. Para el resto del catálogo (1.293 filas) se usa target_es directo
-- del dataset como prefijo (extendiendo la numeración donde ya existía un
-- prefijo DI para ese target_es, o arrancando en 001 con una letra nueva
-- para los target_es sin prefijo previo: BI, TR, PA, AN, CD, CL, TZ, AD,
-- SE, CU), y equipment_es como criterio de dificultad para el número
-- (peso corporal/asistido → banda/polea/tool → mancuerna/kettlebell →
-- barra/máquina compleja), con el nombre como desempate.

WITH prefijo AS (
  SELECT id, nombre_es, target_es, equipment_es,
    CASE target_es
      WHEN 'Deltoides' THEN 'PH'
      WHEN 'Pectorales' THEN 'PE'
      WHEN 'Glúteos' THEN 'GL'
      WHEN 'Cuádriceps' THEN 'RO'
      WHEN 'Isquiotibiales' THEN 'CA'
      WHEN 'Dorsales' THEN 'JA'
      WHEN 'Espalda alta' THEN 'JA'
      WHEN 'Abdominales' THEN 'CO'
      WHEN 'Bíceps' THEN 'BI'
      WHEN 'triceps' THEN 'TR'
      WHEN 'Pantorrillas' THEN 'PA'
      WHEN 'Antebrazos' THEN 'AN'
      WHEN 'Sistema cardiovascular' THEN 'CD'
      WHEN 'Columna / Espinales' THEN 'CL'
      WHEN 'Trapecios' THEN 'TZ'
      WHEN 'Aductores' THEN 'AD'
      WHEN 'Abductores' THEN 'AD'
      WHEN 'Serrato anterior' THEN 'SE'
      WHEN 'Elevador de la escápula' THEN 'CU'
      ELSE 'OT'
    END AS pref,
    CASE
      WHEN equipment_es IN ('Peso corporal','Asistido') THEN 1
      WHEN equipment_es IN ('Banda','Banda elástica','Polea','Soga','Rodillo','Bosu','Pelota de estabilidad','Rueda abdominal','Pelota medicinal') THEN 2
      WHEN equipment_es IN ('Mancuerna','Kettlebell') THEN 3
      ELSE 4
    END AS tier
  FROM catalogo_ejercicios
  WHERE codigo_di IS NULL
),
offsets(pref, base) AS (
  VALUES ('PH',9), ('RO',9), ('PE',5), ('CA',7), ('JA',6), ('GL',7), ('CO',7)
),
ranked AS (
  SELECT p.id, p.pref,
    COALESCE(o.base,0) + ROW_NUMBER() OVER (PARTITION BY p.pref ORDER BY p.tier, p.nombre_es) AS num
  FROM prefijo p
  LEFT JOIN offsets o ON o.pref = p.pref
)
UPDATE catalogo_ejercicios c
SET codigo_di = r.pref || lpad(r.num::text, 3, '0'),
    updated_at = now()
FROM ranked r
WHERE c.id = r.id;
