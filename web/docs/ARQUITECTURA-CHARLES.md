# Arquitectura de Charles — Ecosistema de Agentes

## Visión General

Charles es un orquestador de 8 agentes especializados que trabajan en paralelo para resolver tareas complejas. Cada agente tiene un rol específico, éxito histórico, y capacidades definidas.

## Módulos Principales

### 1. Orquestación (`lib/parallel-agents.ts`)
- **Responsabilidad**: Coordinar ejecución paralela de agentes
- **Flujo**: 
  1. Extraer keywords de la tarea
  2. Cargar success rates dinámicos desde Supabase
  3. Evaluar confidence de cada agente
  4. Seleccionar agentes (usando `lib/agent-selection.ts`)
  5. Ejecutar en paralelo (Promise.all)
  6. Evaluar outputs (peer evaluation)
  7. Sintetizar resultado final

### 2. Selección de Agentes (`lib/agent-selection.ts`)
- **Funciones**:
  - `calculateConfidence(agent, taskKeywords)` → número 0-1
  - `selectAgents(bids, options)` → AgentBid[]
- **Fórmula**: 
  ```
  confidence = (keyword_match × 0.50) + (domain_match × 0.35) + (success_rate × 0.15)
             + learningBoost (hasta +0.08)
             − learningPenalty (hasta -0.03)
  ```
- **Reglas especiales**:
  - Code Specialist entra forzado si 3+ agentes de diseño/content
  - Máximo 6 agentes por coalición
  - Fallback a threshold 0.50 si nadie supera 0.55

### 3. Mejoras de Equipo (`lib/coalition-improvements.ts`)
- **MEJORA 2 — Conexión**: MessageBroker pub/sub
  - Agentes publican specs en canal `coalition-specs`
  - Otros se suscriben para coordinar
- **MEJORA 3 — Aprendizaje**: CentralMemory + Supabase
  - Consulta patrones exitosos ANTES de ejecutar
  - Registra patrones DESPUÉS (si score ≥ 75%)
  - Ajusta confidence dinámicamente
- **MEJORA 4 — Evaluación mutua**: PeerEvaluator con Haiku
  - Matriz: Security→Code, Performance→Code+Design, etc
  - Score 0-25 por evaluador
  - Auto-iteración si promedio < 50%

### 4. Memoria Central (`lib/central-memory/`)
- **7 tablas en Supabase**:
  - `agent_registry` — Agentes + success rates
  - `learning_patterns` — Patrones aprendidos
  - `coalition_history` — Historial de ejecuciones
  - `execution_records` — Detalles de cada run
  - `system_events` — Log de conflictos y errores
  - `message_bus` — Mensajes inter-agentes
  - `embeddings` — Vectores para búsqueda
- **Métodos clave**:
  - `queryPatterns(keywords)` → Pattern[]
  - `recordPattern(keywords, agentsUsed, successRate)` → void
  - `recordExecution(record)` → void

### 5. Selector de Modelos (`lib/model-selector.ts`)
- **Lógica**:
  - Tareas simples → Haiku (rápido, cheap)
  - Tareas complejas → Sonnet (poder, precisión)
  - Security siempre → Sonnet
  - Code siempre → Sonnet
- **Resultado**: ModelAssignment[] (agentId → modelo)

### 6. API Routes (`app/api/coalition/`)
- **POST /api/coalition** — Ejecutar coalición (JSON)
- **POST /api/coalition/stream** — SSE streaming (time-real)
- **GET /api/coalition/monitor** — Salud del sistema
- **POST /api/coalition/feedback** — Registrar feedback

## Flujo de Ejecución (2 Rondas)

```
┌─────────────────────────────────────────────────────────┐
│ RONDA 1: Análisis Paralelo                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Tarea → Context Collector → Todos los agentes          │
│                               ↓                          │
│                          Promise.all()                   │
│                               ↓                          │
│  🎨 Design → specs visuales                             │
│  ⚡ Performance → restricciones de perf                 │
│  🔒 Security → requisitos de seguridad                  │
│  💻 Code → análisis de implementación                   │
│  etc...                                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ ÁRBITRO: Resolver Conflictos                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Claude detecta contradicciones:                        │
│  - Performance vs Design → Performance gana             │
│  - Otro vs Security → Security gana                     │
│  Reconcilia specs                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ RONDA 2: Implementación                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Code Specialist (con tools)                            │
│  ├─ read_file → leer código actual                      │
│  ├─ write_file → escribir cambios                       │
│  ├─ run_build_check → verificar TypeScript              │
│  ├─ run_lint_check → verificar ESLint                   │
│  └─ verify_files_written → confirmar en disco           │
│                                                          │
│  Loop agentico: hasta 8 iteraciones si es necesario    │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ EVALUACIÓN MUTUA: Peer Evaluation                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Matriz de evaluadores (Claude Haiku):                  │
│  Security → Code (¿vulnerabilidades?)                   │
│  Performance → Code+Design (¿eficiente?)                │
│  Design → Content (¿consistencia marca?)                │
│  etc...                                                  │
│                                                          │
│  Score 0-25 por evaluador                               │
│  Auto-iteración si promedio < 50%                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ SÍNTESIS: Plan Unificado                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Claude Haiku integra todos los outputs:                │
│  - Organizado por tema (no por agente)                  │
│  - Sin redundancias                                     │
│  - Prioridades claras                                   │
│  - Listo para ejecutar                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Cambios en la Auditoría

### CRÍTICO (Implementado)
✅ Validación de inputs con Zod (`app/api/coalition/route.ts`)
✅ Hash de tareas en logs (evitar exposición de datos sensibles)

### ALTO (Implementado)
✅ Refactoring de `parallel-agents.ts` (extraído `agent-selection.ts`)
✅ Parser mejorado para peer evaluation (robusto, no regex frágil)

### MEDIO
⏳ Dashboard de monitoreo (opcional, para visibilidad interna)

## Seguridad

1. **Validación de entrada**: Zod schema con refine para detección de prompt injection
2. **Rate limiting**: 10 req/min por IP en `/api/coalition`
3. **Hash de tareas**: Los logs no exponen tareas completas
4. **RLS en Supabase**: Políticas de acceso por usuario
5. **TypeScript strict**: Tipos seguros en todo el codebase

## Próximos Pasos

1. Llenar datos baseline en `learning_patterns` tabla
2. Monitorear coaliciones en producción
3. Ajustar thresholds según resultados reales
4. Documentar casos de uso por agente

---

**Versión**: 3.1 (Post-Auditoría)  
**Último cambio**: 29 de mayo 2026  
**Status**: ✅ Production-ready con mejoras de seguridad
