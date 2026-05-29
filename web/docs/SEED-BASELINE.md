# Seed Baseline Patterns

## Propósito

Inserta datos iniciales de patrones exitosos en la tabla `learning_patterns` de Supabase. Estos datos sirven como punto de referencia para que el **learning loop** del sistema de agentes funcione desde el inicio, sin necesidad de esperar a ejecutar suficientes coaliciones reales.

## Datos Incluidos

| Task Type | Agentes | Score | Descripción |
|-----------|---------|-------|------------|
| **diseño** | 1 (Design) | 92 | Diseño visual simple |
| **diseño_mixto** | 2 (Design + Code) | 88 | Rediseños con implementación |
| **performance** | 3 (Perf + Code + Analytics) | 90 | Optimización de velocidad |
| **seguridad** | 2 (Security + Code) | 96 | Auditoría de seguridad |
| **código** | 1 (Code) | 95 | Implementación clean |
| **contenido** | 2 (Content + Research) | 88 | Copy con investigación |
| **investigación** | 2 (Research + Analytics) | 87 | Análisis profundo |
| **media** | 2 (Media + Design) | 85 | Assets optimizados |
| **auditoría** | 5 (Security + Code + Perf + Analytics + Research) | 82 | Revisión 360° |
| **mejora_general** | 3 (Design + Perf + Code) | 85 | Mejoras multi-aspecto |

## Cómo Ejecutar

### Opción 1: Endpoint HTTP (Recomendado)

Una vez que el servidor está corriendo:

```bash
# Terminal
curl -X POST http://localhost:3000/api/admin/seed-baseline

# O con curl verboso
curl -v -X POST http://localhost:3000/api/admin/seed-baseline | jq .
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "✅ 10/10 patrones baseline insertados",
  "inserted": 10,
  "total": 10,
  "patterns": [
    { "task_type": "diseño", "agents": 1, "score": 92 },
    { "task_type": "diseño_mixto", "agents": 2, "score": 88 },
    ...
  ]
}
```

### Opción 2: SQL Directo en Supabase

1. Abre [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a tu proyecto
3. Abre SQL Editor
4. Copia el contenido de `scripts/seed-baseline-patterns.sql`
5. Ejecuta

### Opción 3: Script Node (Requiere variables de entorno)

```bash
# Requiere SUPABASE_SERVICE_ROLE_KEY configurada
npx ts-node scripts/seed-baseline.ts
```

## Cuándo Ejecutar

- **Primera vez**: Justo después de crear las tablas en Supabase
- **Reinicio**: Si limpias la DB de testing y quieres empezar con baseline conocido
- **No necesario**: Si ya tienes 20+ coaliciones reales registradas

## Qué Pasa Después

Una vez insertados los patrones baseline:

1. ✅ El **learning loop** tiene referencias históricas
2. ✅ Cuando ejecutes `/charles`, el sistema consultará estos patrones
3. ✅ Los agentes que han tenido éxito en tareas similares obtendrán boost de confidence
4. ✅ Con uso real, estos patrones se completan con datos más realistas

## Seguridad

- ✅ Endpoint solo disponible en **desarrollo** (error 403 en producción)
- ✅ No requiere autenticación (local development only)
- ✅ Verificación de variables de entorno Supabase
- ✅ Inserciones resilientes (continúa si una falla)

## Verificación

Para confirmar que los patrones se insertaron:

```sql
-- En Supabase SQL Editor
SELECT task_type, array_length(agents_used, 1) as agent_count, score
FROM learning_patterns
ORDER BY created_at DESC
LIMIT 10;
```

Deberías ver 10 filas con los patrones baseline.

## Notas

- Estos datos tienen scores "idealizados" (85-96), que son altos
- Con coaliciones reales, los scores se normalizarán hacia 70-85
- El sistema ajusta dinámicamente según resultados reales
- **No duplica** si lo ejecutas 2 veces (pueden insertarse duplicados — agregar UNIQUE constraint si necesario)

---

**Status**: ✅ Ready to seed  
**Última actualización**: 29 de mayo 2026
