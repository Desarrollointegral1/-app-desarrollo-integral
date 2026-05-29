# 🧠 CEREBRO — Sistema de Agentes Autónomos
**Última actualización:** 2026-05-29
**Estado:** 🟢 Operativo | Score promedio: 81-92/100

---

## Qué es esto

Un sistema de inteligencia artificial distribuida compuesto por **8 agentes especializados** que trabajan en paralelo (Promise.all) usando la API de Anthropic. Cada agente tiene un dominio de expertise, y una coalición dinámica se forma según la tarea recibida.

El sistema aprende con cada ejecución: guarda patrones en Supabase, construye embeddings semánticos, y usa ese conocimiento para mejorar la selección de agentes en tareas futuras.

---

## Los 8 Agentes

| Agente | Emoji | Modelo | Especialidad |
|---|---|---|---|
| `agent-code-specialist` | 💻 | Sonnet (siempre) | Escribe archivos reales al disco, QA automático |
| `agent-security-specialist` | 🔒 | Sonnet (siempre) | Auditoría crítica, vulnerabilidades, headers |
| `agent-design-specialist` | 🎨 | Sonnet si complejo | UI/UX, jerarquía visual, conversion |
| `agent-performance-specialist` | ⚡ | Sonnet si complejo | FCP, LCP, bundle, fonts, video |
| `agent-analytics-specialist` | 📊 | Sonnet si complejo | Funnel, tracking, métricas, bounce |
| `agent-content-specialist` | ✍️ | Haiku (siempre) | Copy, micro-copy, CTA, propuesta de valor |
| `agent-research-specialist` | 🔍 | Haiku (siempre) | Benchmarks, competencia, datos de industria |
| `agent-media-specialist` | 🎥 | Haiku (siempre) | Video, imágenes, assets multimedia |

**Regla de modelos:**
- Code + Security → siempre Sonnet (generan código que se implementa directo)
- Design + Performance + Analytics → Sonnet en tareas complejas, Haiku en simples
- Content + Research + Media → siempre Haiku (texto de calidad, sin razonamiento profundo)

---

## Pipeline de Ejecución

```
FASE 1 — Routing (instantáneo)
  ↓ Recibe tarea → score de confidence por agente
  ↓ Selecciona agentes con confidence > 50%
  ↓ Asigna modelos por rol + complejidad

FASE 2 — Ronda 1: Agentes de análisis en paralelo (Promise.all)
  ↓ Design + Security + Analytics + Performance + Research + Media + Content
  ↓ Todos corren SIMULTÁNEAMENTE
  ↓ Duración: 18-24s (el más lento define el tiempo)

FASE 2.5 — Árbitro (solo si hay conflictos)
  ↓ Claude Haiku revisa outputs y detecta contradicciones
  ↓ Genera specs reconciliadas para el Code Specialist

FASE 3 — Ronda 2: Code Specialist
  ↓ Recibe outputs de todos los demás + specs reconciliadas
  ↓ Escribe archivos .tsx/.ts/.css reales al disco
  ↓ QA automático: TypeScript check + lint + verificación de archivos

FASE 4 — Peer Evaluation real
  ↓ Security evalúa a Code (auditoría crítica)
  ↓ Performance evalúa a Code + Design (eficiencia)
  ↓ Design evalúa a Content (coherencia visual)
  ↓ Analytics evalúa a Performance (datos vs optimización)
  ↓ Score por par: 0-25 puntos

FASE 5 — Auto-iteración (si score < 75)
  ↓ Detecta el agente con peor score
  ↓ Re-ejecuta solo ese agente con contexto enriquecido
  ↓ Máximo 2 iteraciones

FASE 6 — Síntesis
  ↓ Claude Haiku integra todos los outputs
  ↓ Plan unificado por tema (no por agente)
  ↓ Máx 400 palabras, prioridades claras, listo para ejecutar

FASE 7 — Aprendizaje
  ↓ Guarda patrón en Supabase (task_type, keywords, agents_used, score)
  ↓ Genera embedding TF-IDF para búsqueda semántica futura
  ↓ Próxima tarea similar → consulta patrones → boosts de confidence
```

---

## Archivos del Sistema

```
web/
├── lib/
│   ├── parallel-agents.ts      # Motor central — toda la lógica de coalición
│   ├── agent-tools.ts          # Code Specialist con tools (write_file, read_file)
│   ├── model-selector.ts       # Asigna Sonnet/Haiku por agente y complejidad
│   ├── context-collector.ts    # Escaneo dinámico del proyecto (sin mapa estático)
│   ├── coalition-monitor.ts    # Monitoring — tendencias, alertas, salud
│   ├── external-tools.ts       # Detecta pedidos Adobe/BrightData en outputs
│   └── supabase-agents.ts      # Persistencia: patrones, embeddings, eventos
│
├── app/api/coalition/
│   ├── route.ts                # POST — batch, respuesta completa
│   ├── stream/route.ts         # POST — SSE real-time, evento por evento
│   ├── apply/route.ts          # POST — materializa archivos al disco
│   ├── feedback/route.ts       # POST — feedback humano 👍/👎
│   └── monitor/route.ts        # GET  — reporte de salud del ecosistema
│
├── app/monitor/page.tsx        # Dashboard UI en /monitor
│
└── supabase/migrations/
    └── 001_pgvector_search.sql # pgvector: vector(1536), HNSW, RPC function
```

---

## Base de Datos (Supabase)

### Tablas
| Tabla | Función |
|---|---|
| `agent_registry` | Registro de agentes: success_rate, total_runs, last_active |
| `coalition_history` | Historial de coaliciones: tarea, agentes, score, outcome |
| `learning_patterns` | Patrones aprendidos + `task_embedding vector(1536)` |
| `agent_events` | Log de eventos: errores, warnings, feedback humano |
| `files_written` | Archivos escritos por Code Specialist por coalición |

### Búsqueda semántica (pgvector)
- Columna: `task_embedding vector(1536)` en `learning_patterns`
- Índice: HNSW (cosine similarity, m=16, ef_construction=64)
- RPC: `find_patterns_by_vector(p_embedding, p_threshold=0.70, p_limit=5)`
- Cuando llega una tarea nueva → busca patrones similares → aplica boosts a confidence

---

## API — Cómo Usarlo

### Opción 1: Batch (respuesta completa al final)
```bash
curl -X POST http://localhost:3000/api/coalition \
  -H "Content-Type: application/json" \
  -d '{
    "task": "descripción de la tarea",
    "options": {
      "maxAgents": 6,
      "threshold": 0.50
    }
  }'
```

### Opción 2: Streaming (eventos en tiempo real)
```bash
curl -N -X POST http://localhost:3000/api/coalition/stream \
  -H "Content-Type: application/json" \
  -d '{"task": "descripción de la tarea"}'
```

**Eventos SSE:**
- `coalition_start` → agentes seleccionados
- `phase_update` → fase actual (análisis / árbitro / code / síntesis)
- `agent_result` → output de cada agente al terminar
- `coalition_synthesis` → síntesis final
- `coalition_end` → score total + metadatos
- `error` → error con mensaje

### Opción 3: Aplicar archivos al disco
```bash
curl -X POST http://localhost:3000/api/coalition/apply \
  -H "Content-Type: application/json" \
  -d '{
    "files": [/* array de result.filesToWrite */],
    "coalitionId": "opcional",
    "dryRun": false
  }'
```

### Opción 4: Monitor de salud
```bash
curl http://localhost:3000/api/coalition/monitor?days=30
```

---

## Variables de Entorno

```env
ANTHROPIC_API_KEY=          # Requerida — clave de Anthropic
COALITION_MODEL=claude-haiku-4-5-20251001    # Modelo base (Haiku)
COALITION_MODEL_SONNET=claude-sonnet-4-5     # Modelo premium (Sonnet)
COALITION_MAX_TOKENS=1024   # Tokens máx por agente
NEXT_PUBLIC_SUPABASE_URL=   # URL de Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Anon key de Supabase
```

---

## Cómo Usar desde Charles

### Método 1 — Comando directo
```
En Charles (este chat), escribir:

"Ejecutá una coalición de agentes con esta tarea: [descripción]"

Charles llama a la API internamente y te devuelve el resultado.
```

### Método 2 — curl desde terminal
```bash
# Abrir terminal en la carpeta del proyecto
cd "C:\Users\lucas\OneDrive\Documentos\Claude\Projects\App Desarrollo integral\web"

# Lanzar coalición
curl -X POST http://localhost:3000/api/coalition \
  -H "Content-Type: application/json" \
  -d '{"task": "tu tarea aquí"}'
```

### Método 3 — Skill /charles
```
/charles [descripción de la tarea]
```

---

## Métricas del Sistema

| Métrica | Valor actual |
|---|---|
| Score promedio | 81-92/100 |
| Agentes en paralelo | 5-8 |
| Tiempo típico | 120-160s |
| Tokens por coalición | ~70k |
| Speedup vs secuencial | 5-8x |
| Contexto leído | 4-10 archivos del proyecto |
| Patrones guardados | Creciente |

---

## Integración con Herramientas Externas

El sistema puede detectar cuando un agente pide ejecutar:
- **Adobe**: batch-edit-photos, create-social-variations, design-from-template, retouch-portraits, etc.
- **BrightData**: competitive-intel, seo-audit, scraper-builder, data-feeds

Cuando los detecta, genera instrucciones específicas para ejecutarlos desde Claude Code CLI (donde los MCPs están disponibles).

---

## Dashboard de Monitoreo

URL: `http://localhost:3000/monitor`

Muestra:
- Estado global del sistema (healthy / warning / critical)
- Salud por agente: success rate, trend (↑↓→), sparkline de scores recientes
- Problemas detectados y recomendaciones automáticas
- Salud por tipo de tarea
- Ventana configurable: 7 / 30 / 90 días

---

## Próximos Pasos Naturales

1. **Acumular patrones** — cuantas más coaliciones corran, mejor la búsqueda semántica
2. **Embeddings reales** — conectar OpenAI text-embedding-3-small (ahora usa TF-IDF)
3. **UI de coalición** — interfaz visual para lanzar coaliciones y ver resultados
4. **Webhooks** — notificaciones cuando una coalición termina
5. **Agentes adicionales** — ej. SEO Specialist, Copy Specialist especializado en fitness
