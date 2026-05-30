# CHARLES 10/10 — PLAN DE MEJORAS COMPLETO

**Estado actual**: 3/10 implementación  
**Objetivo**: 10/10 — Producción lista, learning loop real, testing completo  
**Timeline**: ~8-10 horas de trabajo intenso

---

## 📊 SCORECARD ACTUAL vs TARGET

```
                    ACTUAL  →  TARGET
Arquitectura:         8/10  →  10/10  (✅ Ya bien)
Implementación:       3/10  →  10/10  (🔴 CRÍTICA)
Learning:             0/10  →  10/10  (🔴 CRÍTICA)
Success Rates:        2/10  →  10/10  (🔴 CRÍTICA)
Testing:              0/10  →  10/10  (🔴 CRÍTICA)
Performance:          5/10  →  10/10  (🟠 ALTA)
Monitoring:           7/10  →  10/10  (🟡 MEDIA)
Documentation:        4/10  →  10/10  (🟡 MEDIA)

VEREDICTO FINAL:      3/10  →  10/10
```

---

## 🔴 BLOQUE 1: LEARNING LOOP REAL (CRÍTICA)

### Problema actual
- Success rates son teóricos (0.85-0.97 inflados)
- No hay actualización basada en feedback real
- Learning adjustments (+0.08, +0.05, -0.03) nunca se aplican
- Sistema NO mejora con cada coalición ejecutada

### Solución

#### 1.1 Crear tabla `learning_adjustments` en Supabase
```sql
-- Tabla nueva: learning_adjustments
CREATE TABLE learning_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  keyword_cluster TEXT,  -- "navbar_design", "performance_optimization", etc
  
  -- Métricas
  times_selected INT DEFAULT 0,
  times_succeeded INT DEFAULT 0,
  avg_score FLOAT DEFAULT 0.5,
  
  -- Ajuste dinámico
  adjustment FLOAT DEFAULT 0.0,  -- -0.03 a +0.08
  reason TEXT,  -- "score >= 90 en 3+ tareas similares"
  
  -- Metadata
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_learning_agent_task ON learning_adjustments(agent_id, task_type);
CREATE INDEX idx_learning_keyword ON learning_adjustments(keyword_cluster);
```

#### 1.2 Función: `updateSuccessRateWithLearning()`
Ubicación: `lib/supabase-agents.ts`

```typescript
async updateSuccessRateWithLearning(
  agentId: string, 
  wasSuccessful: boolean,
  peerScore?: number,  // 0-25
  taskType?: string,
  keywords?: string[]
): Promise<void> {
  // 1. Actualizar agent_registry.success_rate
  // 2. Registrar en learning_patterns con embedding
  // 3. Calcular y guardar en learning_adjustments
  // 4. Generar descripción de ajuste para próxima vez
}
```

**Lógica:**
- Si último score >= 90: +0.08 adjustment (cuando este agente sea seleccionado para tarea similar)
- Si último score 80-89: +0.05 adjustment
- Si último score < 60: -0.03 penalty
- Si 3+ resultados similares exitosos: boost extra

#### 1.3 Función: `getLearningAdjustmentForAgent()`
Ubicación: `lib/supabase-agents.ts`

Cuando se seleccionan agentes, consultar:
```typescript
const adjustment = await db.getLearningAdjustmentForAgent(
  agentId, 
  taskKeywords
);
// Retorna: { adjustment: 0.05, source: "3 navbar tasks > 85" }
```

Se aplica al confidence score:
```typescript
let confidence = calculateConfidence(...);  // 0.45
confidence += adjustment.adjustment;        // + 0.05
// Final: 0.50 → seleccionable
```

---

## 🟠 BLOQUE 2: PEER EVALUATION REAL CON CLAUDE HAIKU (CRÍTICA)

### Problema actual
- Sistema de peer eval está diseñado pero NO se ejecuta
- Cada agente evalúa a otros pero sin modelo de IA
- Scores son ficticios (0-25) sin base real

### Solución

#### 2.1 Crear función `evaluateAgentOutputs()`
Ubicación: `lib/peer-evaluator.ts` (nuevo archivo)

```typescript
export async function evaluateAgentOutputs(
  agentResults: AgentResult[],
  taskDescription: string,
  projectContext: ProjectContext
): Promise<Record<string, number>> {
  // 1. Para cada agente, buscar evaluadores (Security → Code, Performance → Design, etc)
  // 2. Llamar a Claude Haiku con prompt específico del evaluador
  // 3. Extraer score 0-25 de la respuesta
  // 4. Guardar en learning_patterns.peer_evaluation_scores
  // 5. Retornar record { 'agent-design-specialist': 22, ... }
  
  const client = new Anthropic();
  const evaluationPrompts = buildEvaluationPrompts(agentResults, taskDescription);
  
  const results: Record<string, number> = {};
  
  // Ejecutar evaluaciones en paralelo (máx 5 simultáneas para no sobrecargar)
  const chunks = chunkArray(evaluationPrompts, 5);
  for (const chunk of chunks) {
    const evals = await Promise.all(
      chunk.map(p => client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 300,
        system: p.evaluatorPrompt,
        messages: [{ role: 'user', content: p.evaluationQuestion }]
      }))
    );
    
    for (let i = 0; i < chunk.length; i++) {
      const score = extractScoreFromResponse(evals[i].content[0]);
      const [evaluator, target] = chunk[i].pair;
      results[target] = score;
    }
  }
  
  return results;
}

function buildEvaluationPrompts(
  results: AgentResult[],
  task: string
): Array<{ evaluatorPrompt: string; evaluationQuestion: string; pair: [string, string] }> {
  // Tabla de evaluaciones:
  const evaluations = [
    ['agent-security-specialist', 'agent-code-specialist', '¿el código tiene vulnerabilidades?'],
    ['agent-performance-specialist', 'agent-code-specialist', '¿la implementación es eficiente?'],
    ['agent-design-specialist', 'agent-content-specialist', '¿el copy es consistente con marca?'],
    ['agent-analytics-specialist', 'agent-performance-specialist', '¿optimizaciones atacan KPIs?'],
    ['agent-research-specialist', 'agent-content-specialist', '¿posicionamiento es preciso?'],
  ];
  
  return evaluations.map(([evaluatorId, targetId, question]) => {
    const targetResult = results.find(r => r.agentId === targetId);
    const evaluatorResult = results.find(r => r.agentId === evaluatorId);
    
    return {
      evaluatorPrompt: buildEvaluatorSystemPrompt(evaluatorId),
      evaluationQuestion: `
        Task: "${task}"
        
        Output del agente ${targetId}:
        ${targetResult?.output || 'N/A'}
        
        ${evaluatorResult ? `Tu análisis (${evaluatorId}): ${evaluatorResult.output}` : ''}
        
        Pregunta: ${question}
        
        Responde SOLO con un número 0-25, sin explicación.
        0 = crítico, 12-13 = aceptable, 25 = excelente.
      `,
      pair: [evaluatorId, targetId]
    };
  });
}
```

#### 2.2 Sistema de auto-iteración si score < 75
```typescript
// En parallel-agents.ts, después de peer eval:
if (collectiveScore < 75) {
  // Encontrar agente con peor score
  const worstAgent = Object.entries(peerScores)
    .sort(([,a], [,b]) => a - b)[0];
  
  if (worstAgent[0] !== 'agent-code-specialist') {
    // Re-ejecutar ese agente con feedback de evaluadores
    // (NO re-ejecutar Code Specialist, es muy costoso)
    const improvement = await reExecuteAgent(worstAgent[0], feedbackFromEvaluators);
    // ...
  }
}
```

---

## 🟡 BLOQUE 3: CONTEXT COLLECTOR MEJORADO (ALTA)

### Problema actual
- Límite de 40k chars total
- Si proyecto tiene 200k chars, pierde 80%
- Sin paginación ni caché
- Sin priorización de archivos por relevancia

### Solución

#### 3.1 Aumentar límites y agregar paginación
`lib/context-collector.ts`:

```typescript
const MAX_FILE_CHARS = 8_000;      // Por archivo
const MAX_TOTAL_CHARS = 120_000;   // Aumentado de 40k
const PAGINATION_SIZE = 15_000;    // Ventana deslizante si excede

// Función nueva: recolección inteligente con paginación
export async function collectProjectContextPaginated(
  keywords: string[],
  options: { pageSize?: number; maxPages?: number } = {}
): Promise<ProjectContext> {
  const discovered = discoverProjectFiles();
  
  // Paso 1: Score cada archivo por relevancia
  const scored = discovered.map(f => ({
    ...f,
    relevanceScore: computeRelevance(f, keywords)
  })).sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // Paso 2: Recolectar en orden de relevancia hasta MAX_TOTAL_CHARS
  const files: FileSnapshot[] = [];
  let totalChars = 0;
  
  for (const f of scored) {
    const content = readFileWithLimit(f.relativePath, MAX_FILE_CHARS);
    const charCount = content.length;
    
    if (totalChars + charCount > MAX_TOTAL_CHARS) {
      // Si hay espacio pero no para todo, truncar
      const remaining = MAX_TOTAL_CHARS - totalChars;
      if (remaining > 1000) {  // Min 1k por archivo
        const truncated = content.slice(0, remaining);
        files.push({ relativePath: f.relativePath, content: truncated, ... });
        totalChars = MAX_TOTAL_CHARS;
        break;
      } else {
        break;  // Siguiente archivo no cabe
      }
    }
    
    files.push({ relativePath: f.relativePath, content, ... });
    totalChars += charCount;
  }
  
  return { files, componentsList: [...], routesList: [...], ... };
}

function computeRelevance(file: DiscoveredFile, keywords: string[]): number {
  let score = 0;
  const fileTokens = file.nameTokens;
  
  // Coincidencia de tokens
  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    if (fileTokens.some(t => t.includes(kwLower) || kwLower.includes(t))) {
      score += 10;
    }
  }
  
  // Archivos "siempre importan"
  if (ALWAYS_INCLUDE.some(a => file.relativePath.includes(a))) {
    score += 50;
  }
  
  // Penalizar archivos grandes (menos datos útiles)
  if (file.relativePath.endsWith('.map.js')) score -= 100;
  if (file.relativePath.includes('node_modules')) score -= 100;
  
  return score;
}
```

#### 3.2 Caché de contexto (para tareas similares)
```typescript
// Nueva: context-cache.ts
interface CachedContext {
  keywords: string[];  // Hash para validar si es "similar"
  context: ProjectContext;
  cached_at: number;
  ttl_ms: number;  // 5 min
}

class ContextCache {
  private cache: Map<string, CachedContext> = new Map();
  
  getCacheKey(keywords: string[]): string {
    return keywords.sort().join('|');  // "design|navbar" etc
  }
  
  get(keywords: string[]): ProjectContext | null {
    const key = this.getCacheKey(keywords);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    if (Date.now() - cached.cached_at > cached.ttl_ms) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.context;
  }
  
  set(keywords: string[], context: ProjectContext): void {
    const key = this.getCacheKey(keywords);
    this.cache.set(key, {
      keywords,
      context,
      cached_at: Date.now(),
      ttl_ms: 5 * 60 * 1000,  // 5 min
    });
  }
}
```

---

## 🔵 BLOQUE 4: PERFORMANCE OPTIMIZATION (ALTA)

### 4.1 Paralelizar Code Specialist loop

`lib/agent-tools.ts`:
```typescript
// ANTES: secuencial
for (const file of filesToWrite) {
  await writeFile(file);
  const linted = await runLintCheck(file);
  // ...
}

// DESPUÉS: paralelo por fases
const writePhase = filesToWrite.map(f => writeFile(f));
await Promise.all(writePhase);

const lintPhase = filesToWrite.map(f => runLintCheck(f));
const lintResults = await Promise.all(lintPhase);

const typeCheckPhase = lintResults.filter(r => r.success).map(r => runTypeCheck(r.file));
const typeResults = await Promise.all(typeCheckPhase);
```

Estimado: 15-24s → 8-10s (reduce 50%)

### 4.2 Caché de evaluaciones
```typescript
// En parallel-agents.ts

// Crear hash del output de un agente
function hashAgentOutput(result: AgentResult): string {
  return crypto
    .createHash('sha256')
    .update(result.output)
    .digest('hex');
}

// Almacenar evaluaciones en caché
const evaluationCache = new Map<string, Record<string, number>>();

// Antes de evaluar
const outputHashes = results.map(r => ({ agentId: r.agentId, hash: hashAgentOutput(r) }));
const cacheKey = outputHashes.map(h => h.hash).join('|');

if (evaluationCache.has(cacheKey)) {
  peerScores = evaluationCache.get(cacheKey)!;
} else {
  peerScores = await evaluateAgentOutputs(results, task, context);
  evaluationCache.set(cacheKey, peerScores);
}
```

### 4.3 Timeout + reintentos Supabase
```typescript
// lib/supabase-agents.ts

async queryWithRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries = 3; timeoutMs = 10000 } = {}
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Supabase timeout')),
            options.timeoutMs
          )
        )
      ]);
    } catch (err) {
      lastError = err as Error;
      if (attempt < options.maxRetries) {
        const backoff = Math.pow(2, attempt - 1) * 100;  // exponential backoff
        await new Promise(r => setTimeout(r, backoff));
      }
    }
  }
  
  throw lastError || new Error('queryWithRetry failed');
}
```

---

## 🟢 BLOQUE 5: TESTING & VALIDATION (CRÍTICA)

### 5.1 Crear suite de tests reales
`scripts/test-charles.ts`:

```typescript
/**
 * Suite de tests: 10 coaliciones reales con todas las métricas
 * Ejecuta 10 tareas diferentes, registra todo en Supabase
 */

interface TestCase {
  name: string;
  task: string;
  expectedAgents: string[];  // Validar que estos se seleccionan
}

const TEST_SUITE: TestCase[] = [
  {
    name: 'Navbar Design + Premium',
    task: 'rediseña el navbar con estilo premium y gold',
    expectedAgents: ['agent-design-specialist', 'agent-code-specialist']
  },
  {
    name: 'Performance Optimization',
    task: 'optimiza el FCP que está en 2.1s, tiene que bajar a 0.8s',
    expectedAgents: ['agent-performance-specialist', 'agent-analytics-specialist']
  },
  // ... 8 más
];

async function runTestSuite() {
  console.log('🧪 Iniciando test suite de Charles...\n');
  
  const results = [];
  
  for (const testCase of TEST_SUITE) {
    console.log(`📋 Test: ${testCase.name}`);
    console.log(`   Tarea: ${testCase.task}\n`);
    
    const startTime = Date.now();
    const result = await runCoalition(testCase.task, {
      captureMetrics: true,
      expectAgents: testCase.expectedAgents
    });
    const duration = Date.now() - startTime;
    
    // Validaciones
    const hasExpectedAgents = testCase.expectedAgents.every(a =>
      result.selectedAgents.some(b => b.agentId === a)
    );
    
    const passed = hasExpectedAgents && result.collectiveScore >= 70;
    
    console.log(`   ✅ Score: ${result.collectiveScore}/100`);
    console.log(`   ⏱️  Duración: ${duration}ms`);
    console.log(`   🤝 Agentes: ${result.selectedAgents.map(a => a.agentName).join(', ')}`);
    console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'}\n`);
    
    results.push({
      testCase: testCase.name,
      passed,
      score: result.collectiveScore,
      duration,
      selectedAgents: result.selectedAgents.map(a => a.agentId),
    });
  }
  
  // Resumen
  const passedCount = results.filter(r => r.passed).length;
  console.log(`\n📊 RESUMEN: ${passedCount}/${results.length} tests pasados`);
  
  return results;
}

// Ejecutar: npx ts-node scripts/test-charles.ts
```

### 5.2 Validar success rates
```typescript
/**
 * Después de test suite, validar que success rates en Supabase
 * tienen variación realista (no todos 0.85-0.97)
 */

async function validateSuccessRates() {
  const db = getSupabaseAgents();
  const agents = await db.getAgents();
  
  for (const agent of agents) {
    const rate = agent.success_rate;
    
    // Validaciones
    if (rate < 0.5 || rate > 1.0) {
      throw new Error(`❌ ${agent.display_name}: rate ${rate} fuera de rango`);
    }
    
    if (agent.total_tasks === 0) {
      throw new Error(`❌ ${agent.display_name}: sin tareas registradas`);
    }
    
    const expected = agent.successful_tasks / agent.total_tasks;
    const diff = Math.abs(rate - expected);
    if (diff > 0.05) {
      console.warn(`⚠️  ${agent.display_name}: rate ${rate} vs calculado ${expected}`);
    }
  }
  
  console.log('✅ Success rates validados');
}
```

---

## 🟢 BLOQUE 6: MONITORING & OBSERVABILITY (MEDIA)

### 6.1 Endpoint de diagnostico mejorado
`app/api/charles/health/route.ts`:

```typescript
/**
 * GET /api/charles/health
 * Diagnóstico completo de Charles en un solo endpoint
 */

export async function GET() {
  const db = getSupabaseAgents();
  const monitor = await runCoalitionMonitor(7);  // Última semana
  
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    
    // Learning loop status
    learning: {
      patterns_count: await db.countLearningPatterns(),
      adjustments_applied: await db.countAppliedAdjustments(),
      last_update: await db.getLastLearningUpdate(),
      is_active: /* verificar si hay patrón reciente */,
    },
    
    // Agent health
    agents: monitor.agentHealth.map(h => ({
      id: h.agentId,
      name: h.agentName,
      rate: h.successRate,
      trend: h.trend,
      alert: h.alert ? h.alertMsg : null,
    })),
    
    // System metrics
    system: {
      status: monitor.systemStatus,
      success_rate: monitor.successfulRate,
      avg_score: monitor.avgCollectiveScore,
      total_coalitions: monitor.totalCoalitions,
    },
    
    // Recommendations
    recommendations: monitor.recommendations,
  });
}
```

---

## 🟢 BLOQUE 7: DOCUMENTATION (MEDIA)

### 7.1 Actualizar CHARLES-SKILL.md con cambios reales
- Cambiar "teórico" → "implementado"
- Agregar metricas reales de success rates
- Documentar learning loop
- Incluir scores de test suite

### 7.2 Crear CHARLES-DEPLOYMENT.md
- Cómo deployar los cambios
- Env vars necesarias
- Migraciones de Supabase

---

## ⏱️ CRONOGRAMA DE EJECUCIÓN

| Bloque | Descripción | Horas | Prioridad |
|--------|---|---|---|
| 1 | Learning loop real | 2.5 | 🔴 CRÍTICA |
| 2 | Peer eval con Haiku | 2.0 | 🔴 CRÍTICA |
| 3 | Context Collector mejorado | 1.5 | 🟠 ALTA |
| 4 | Performance opt | 1.5 | 🟠 ALTA |
| 5 | Testing & validation | 2.0 | 🔴 CRÍTICA |
| 6 | Monitoring mejorado | 1.0 | 🟡 MEDIA |
| 7 | Documentation | 1.5 | 🟡 MEDIA |

**Total: ~12 horas**

---

## 🎯 MÉTRICAS DE ÉXITO

✅ **Learning loop**: learning_adjustments se llena después de cada coalición  
✅ **Peer eval**: 5 evaluaciones reales ejecutadas por coalición (Haiku)  
✅ **Success rates**: Varían de 0.60-0.95, no todos inflados  
✅ **Test suite**: 10/10 tests pasando, scores >= 75  
✅ **Performance**: Coalición completa en < 30s (PASO 1) o < 60s (PASO 2)  
✅ **Health endpoint**: Retorna datos reales sin errores  
✅ **Docs**: CHARLES-SKILL.md actualizado, sin promesas "teóricas"  

---

## 🚀 PRÓXIMAS FASES (DESPUÉS DE 10/10)

- **PASO 2**: Autonomía real (coaliciones sin invocación)
- **PASO 3**: Learning loop que ajusta agents.json automáticamente
- **PASO 4**: Dashboard web visual
- **PASO 5**: Integración Adobe + BrightData real

---

**Creado**: 2026-05-29  
**Objetivo**: Llevar Charles de prototipo a producción  
**Estado**: ✅ Listo para ejecutar
