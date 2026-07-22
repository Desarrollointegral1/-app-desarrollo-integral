# Plan — Coach IA dentro de la app (Desarrollo Integral)

> Asistente conversacional flotante dentro de la app de gestión, que conoce al alumno y está entrenado en el método de Integral. Función estrella de la v1: **entrenador en vivo** (guía la sesión ejercicio por ejercicio).
> Escrito 2026-07-21. Decisión de arranque tomada por Lucas: base conversacional + entrenador en vivo.

## La arquitectura: "un cerebro, dos caras"

```
FÁBRICA (offline, lento)        CEREBRO CURADO              COACH (en vivo, rápido)
NotebookLM + el Consejo    →    CEREBRO-ENTRENAMIENTO.md  →  ┌─ Widget flotante en la app (v1)
estudian y mejoran              CEREBRO-DE-PLANES.md         └─ Bot de WhatsApp (v2, misma pieza)
el método todos los días        cerebro-mejorado/*.md            ↑
                                planes de nutrición          + DATOS DEL ALUMNO (Supabase de la app)
```

La fábrica (NotebookLM + Consejo diario a las 12) NO es el chatbot: es lo que fabrica el conocimiento. El coach es una sola pieza de backend que usa ese conocimiento + los datos del alumno. La misma pieza sirve al widget de la app hoy y al bot de WhatsApp después.

## Estado real de lo que ya existe (verificado en código, 2026-07-21)

- **NO hay chatbot funcionando** — ni en la app ni en WhatsApp. Hay un endpoint suelto (`/web/api/brains/[id]/query`) que responde una pregunta sin memoria, y nadie lo llama.
- **El "Brain Factory" (`web/lib/brain-factory/`) NO se conecta con NotebookLM** pese al nombre del archivo — es Claude con prompt fijo. Su RAG es placeholder (embeddings en cero, agarra 5 docs al azar). Los cerebros son genéricos por dominio (máx 4), **no por alumno**. → No se reutiliza como está; sí se puede reusar la infra de Next + el SDK de Anthropic que ya tiene.
- **La app (`App.jsx`, Vite)** es un SPA sin backend, navegación por estado, un solo archivo de ~6.600 líneas. Todos los datos del alumno ya se cargan en memoria en el objeto `alumno`.
- **Ambos proyectos comparten la misma base Supabase** (`tlxkghpytznkxgqslqzj`).

## Decisiones técnicas (ya tomadas)

1. **El endpoint del coach va en `web/`** (Next.js), no en la app Vite. Motivo: `web/` ya tiene el SDK de Anthropic, comparte la misma base Supabase, y ya está proxeado bajo el mismo dominio (`app-desarrollo-integral.vercel.app/web/*` → Next). La app llama a `/web/api/coach`.
2. **La API key de Anthropic vive solo en el server** (`web/.env.local`). Nunca en el front — si no, cualquiera la roba y quema tokens. Por eso el coach es server-side sí o sí.
3. **Nada de RAG con embeddings en la v1.** El método curado es chico (unos pocos markdown). Se le mete el texto relevante directo al contexto de Claude. Menos piezas, más robusto. Se agrega búsqueda vectorial recién si el cerebro crece a decenas de documentos.
4. **Modelo: `claude-opus-4-8`** (el que ya usa el Brain Factory).

## Las piezas de la v1

### 1. Widget flotante (front, en `App.jsx` de la raíz)
- Componente nuevo `src/components/CoachFlotante.jsx`, `position:fixed`, arrastrable, con globito.
- Logo: reusar el ICON SVG inline que ya existe y cambia con el tema (`App.jsx:103-104`, `ICON_WHITE`/`ICON_BLACK`).
- Montado dentro de `App()` como hermano de `<Toast/>` para que reciba el `alumno` logueado y aparezca en todas las pantallas.
- Al clic: abre panel de chat estilo WhatsApp/ChatGPT (burbujas, input abajo, historial arriba).

### 2. Endpoint `/web/api/coach` (back, Next.js)
Recibe: `{ alumnoId, mensaje, historial[] }`. Arma el contexto y llama a Claude. Devuelve el texto del coach.
Contexto que arma (system prompt):
- **El método**: texto de CEREBRO-ENTRENAMIENTO.md + reglas maestras + tono de Integral (voseo, seguridad primero, técnica innegociable).
- **El alumno**: nombre, edad, peso, altura, objetivo, plan actual, RMs, últimos registros, diario, bioimpedancia — todo lo que ya está en Supabase.
- **La sesión de hoy** (para el entrenador en vivo): el plan del día del alumno (`alumno_planes → plan_dias → plan_ejercicios`) + los cues/errores/progresiones de cada ejercicio (Parte 6 del método + `biblioteca_ejercicios`).

### 3. Memoria por alumno (tabla nueva en Supabase)
`coach_conversaciones` — `{ id, alumno_id, rol (user/assistant), mensaje, creado_en }`. Así el chat recuerda charlas anteriores. Con RLS igual que el resto (service_role del lado del endpoint).

### 4. Modo "Entrenador en vivo" (la función estrella)
Un botón/intent dentro del chat: "Arrancá mi sesión de hoy". El coach:
- Sabe qué plan/día le toca (de los datos del alumno).
- Lo guía ejercicio por ejercicio: qué hacer, cuántas series/reps, con qué carga (según su RM y la semana de periodización), el cue principal y los errores a evitar.
- Le da tips y responde dudas en el momento ("¿cómo hago la bisagra de cadera?").
- Nunca inventa cargas: usa la intensidad como % del máximo del alumno (regla del método, sin RIR).

## Seguridad y cuidados (importante)

- **Toca la app que usan tus alumnos de verdad.** Primero se prueba con TU propio alumno de prueba, detrás de un flag, antes de que lo vea nadie.
- **Cada mensaje cuesta tokens de la API.** Es barato por mensaje pero hay que tenerlo en cuenta si lo usan muchos alumnos — se puede poner un límite por alumno/día.
- El endpoint del coach queda protegido para que solo lo llame la app logueada, no cualquiera desde afuera.

## Orden de construcción

1. **Tabla `coach_conversaciones`** en Supabase (invisible, cero riesgo).
2. **Endpoint `/web/api/coach`** con el contexto del método + alumno + sesión del día. Probado por consola antes de tocar la app.
3. **Widget flotante** en la app, conectado al endpoint. Probado con un alumno de prueba.
4. **Modo entrenador en vivo** afinado sobre esa base.
5. Recién cuando funciona con vos → se abre a alumnos reales.

## Qué NO hace la v1 (para no dispersar)

- No es el bot de WhatsApp todavía (esa es la v2, misma pieza de backend, otra cara).
- No genera planes de nutrición todavía (siguiente función después del entrenador en vivo — la base ya la deja lista).
- No usa búsqueda vectorial (no hace falta al tamaño actual del cerebro).
