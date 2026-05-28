# 📋 LUCAS — Block de Notas Operacional
**Última actualización:** 2026-05-28
**Este archivo se actualiza solo cada vez que se hace un cambio.**

---

## 🔗 TODOS LOS LINKS (los que usás siempre)

| Qué es | Link |
|--------|------|
| 🌐 **Web en vivo** | (pendiente — dominio de producción) |
| 💻 **Web local** (cuando está corriendo) | http://localhost:3000 |
| 📊 **Monitor de agentes** (auto-refresh 60s) | http://localhost:3000/monitor |
| 🐙 **GitHub** — código del proyecto | https://github.com/Desarrollointegral1/-app-desarrollo-integral |
| 📄 **CEREBRO.md** en GitHub | https://github.com/Desarrollointegral1/-app-desarrollo-integral/blob/main/web/docs/CEREBRO.md |
| 📄 **DESARROLLO-INTEGRAL.md** en GitHub | https://github.com/Desarrollointegral1/-app-desarrollo-integral/blob/main/web/docs/DESARROLLO-INTEGRAL.md |
| 📄 **Este archivo (LUCAS.md)** en GitHub | https://github.com/Desarrollointegral1/-app-desarrollo-integral/blob/main/web/docs/LUCAS.md |
| 🗄️ **Supabase** — base de datos | https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj |
| 🗄️ **Supabase SQL** — para correr migraciones | https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj/sql |
| 🗄️ **Supabase Tables** — ver datos | https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj/editor |

---

## ⚡ CÓMO USAR EL SISTEMA — Una sola línea

```
/charles [describí qué querés que haga]
```

**Ejemplos:**
```
/charles mejorá el formulario de contacto
/charles auditá la seguridad del proyecto
/charles rediseñá la sección de testimonios, tiene que verse premium
/charles por qué el bounce rate mobile está alto?
/charles creá una nueva sección de precios
```

**Eso es todo.** El sistema hace el resto solo.

---

## 🧠 QUÉ ES EL CEREBRO — Explicado simple

Es una "granja" de 8 robots especializados (agentes de IA) que trabajan juntos en paralelo para resolver tareas de tu proyecto. Cuando escribís `/charles algo`, pasan estas cosas en 2-3 minutos:

1. **Lee el código** de tu proyecto automáticamente
2. **Elige qué robots usar** según la tarea (no manda a todos siempre)
3. **Los robots trabajan todos al mismo tiempo** (no uno por uno) — por eso es rápido
4. **Se evalúan entre ellos** — Security revisa a Code, Analytics revisa a Performance, etc.
5. **Code Specialist escribe los archivos directamente** al disco (modifica el código real)
6. **Aprende** — guarda en Supabase qué funcionó, para hacerlo mejor la próxima vez
7. **Actualiza GitHub** — los docs se actualizan solos

### Los 8 Robots

| Robot | Para qué sirve |
|-------|---------------|
| 💻 **Code Specialist** | Escribe código real en tus archivos |
| 🔒 **Security Specialist** | Detecta vulnerabilidades y problemas de seguridad |
| 🎨 **Design Specialist** | UX, diseño visual, jerarquía, conversión |
| ⚡ **Performance Specialist** | Velocidad, FCP, Lighthouse score |
| 📊 **Analytics Specialist** | Métricas, funnel, bounce rate, CTA clicks |
| ✍️ **Content Specialist** | Copy, textos, propuesta de valor |
| 🔍 **Research Specialist** | Benchmarks, competencia, datos de industria |
| 🎥 **Media Specialist** | Video, imágenes, assets multimedia |
| 🔎 **SEO Specialist** | Posicionamiento Google, keywords locales Belgrano, schema.org |
| 🏋️ **Fitness Specialist** | Validación de dominio: metodología, servicios, copy fitness |
| 🎬 **Creative Media Agent** | Genera imágenes (Flux) y videos (Kling) vía API FAL.ai ← NUEVO |

**Modelo por robot:**
- Code + Security → **Claude Sonnet** (el más capaz, genera código que va directo al proyecto)
- El resto → **Claude Haiku** (más rápido, más barato, suficiente para texto y análisis)

---

## 🏋️ QUÉ ES DESARROLLO INTEGRAL — Explicado simple

**Centro de entrenamiento personalizado premium en Belgrano, Buenos Aires.**

**La diferencia:** No gimnasio genérico. Programas basados en datos reales de cada persona.

**Cómo funciona para el cliente:**
1. Evaluación inicial (30 min, gratis, presencial)
2. Programa personalizado en base a datos
3. Seguimiento continuo con métricas
4. Resultados en 90 días

**Target:** Profesionales urbanos 28-45 años, Belgrano y zonas premium de CABA.

---

## 🌐 LA PÁGINA WEB — Estado actual

**Stack tecnológico** (lo que usa por adentro):
- Next.js 16 + React 19 + Tailwind CSS 4
- Framer Motion + GSAP (animaciones)
- TypeScript (lenguaje)

**Carpeta del proyecto:**
```
C:\Users\lucas\OneDrive\Documentos\Claude\Projects\App Desarrollo integral\web
```

**Cómo arrancarla localmente:**
```
cd "C:\Users\lucas\OneDrive\Documentos\Claude\Projects\App Desarrollo integral\web"
npm run dev
```
Luego abrir http://localhost:3000

**Colores del diseño:**
- Dorado: `#C8A96E` (CTAs, highlights)
- Fondo: `#0a0a0a` (negro)
- Estilo: premium, dark, minimalista

### Secciones de la landing (de arriba para abajo)

| Sección | Estado | Notas |
|---------|--------|-------|
| Hero (video + CTA) | ✅ Mejorado por agentes | Single CTA, stats above-fold |
| Stats Grid | 🔲 Pendiente mover | Tiene que ir en el hero |
| Método/Identidad | ✅ | |
| Testimonios | 🔲 Pendiente mejorar | |
| Formulario de contacto | 🔲 Pendiente optimizar | |
| Footer | ✅ | |

### Métricas objetivo

| Métrica | Hoy | Meta |
|---------|-----|------|
| Lighthouse Performance | 78 | 95+ |
| Velocidad (FCP) | 2.1s | 0.8s |
| Clicks en CTA | 4.2% | 8%+ |
| Bounce mobile | 42% | 18% |

---

## 🗄️ BASE DE DATOS (Supabase)

**Qué guarda:**

| Tabla | Para qué |
|-------|---------|
| `agent_registry` | Historial de cada robot: cuántas veces corrió, qué tan bien le fue |
| `coalition_history` | Registro de cada coalición: tarea, quiénes participaron, score |
| `learning_patterns` | Qué patrones funcionaron → el sistema aprende de esto |
| `agent_events` | Log de todo: errores, warnings, feedback |
| `files_written` | Qué archivos modificó el Code Specialist y cuándo |
| `video_cuts` | Historial de cada corte de video: timestamps, estilo, rating ✅ |
| `video_style_profile` | Perfil aprendido: cómo te gustan los cortes (ratio, tags, estilo) ✅ |

**Búsqueda inteligente:** La DB tiene un sistema de vectores (pgvector) que permite buscar tareas similares. Si ya hiciste algo parecido antes, el sistema lo recuerda y lo usa.

---

## 📁 ARCHIVOS QUE CREAMOS (los importantes)

### El sistema de agentes
```
web/lib/parallel-agents.ts      ← El motor central (ahora: 11 agentes)
web/lib/agent-tools.ts          ← Las herramientas que usa Code Specialist
web/lib/model-selector.ts       ← Qué modelo (Sonnet/Haiku) usa cada robot
web/lib/context-collector.ts    ← Lee el proyecto antes de trabajar
web/lib/coalition-monitor.ts    ← Monitorea la salud del sistema
web/lib/external-tools.ts       ← Detecta si necesita Adobe o BrightData
web/lib/supabase-agents.ts      ← Guarda todo en la base de datos
web/lib/creative-media.ts       ← Generación de imágenes y videos vía FAL.ai
web/lib/video-editor.ts         ← Corte y edición de videos con FFmpeg + IA
web/lib/video-learning.ts       ← Aprende tu estilo de corte, gestiona carpetas ← NUEVO
```

### Las rutas de la API
```
web/app/api/coalition/route.ts          ← Punto de entrada principal
web/app/api/coalition/stream/route.ts   ← Versión en tiempo real
web/app/api/coalition/apply/route.ts    ← Escribe los archivos al disco
web/app/api/coalition/feedback/route.ts ← Feedback humano 👍/👎
web/app/api/coalition/monitor/route.ts  ← Estado de salud
web/app/api/creative/route.ts           ← Genera imágenes y videos con IA
web/app/api/video/route.ts              ← Corta y edita videos con FFmpeg
web/app/api/video/rate/route.ts         ← Dar feedback para que aprenda tu estilo ← NUEVO
```

### Los documentos (todos en GitHub)
```
web/docs/CEREBRO.md             ← Todo el sistema técnico en detalle
web/docs/DESARROLLO-INTEGRAL.md ← Todo del negocio y la landing
web/docs/LUCAS.md               ← Este archivo (el block de notas)
web/scripts/update-docs.js      ← Script que actualiza y sube a GitHub
```

### La base de datos
```
web/supabase/migrations/001_pgvector_search.sql  ← Ya ejecutado en Supabase
```

---

## 🔄 CÓMO SE ACTUALIZA TODO SOLO

1. **Cuando corre una coalición** → `DESARROLLO-INTEGRAL.md` se actualiza con el resultado (fecha, score, qué hizo)

2. **Cuando Claude para** → Se hace un `git commit + push` automático a GitHub con todos los cambios

3. **El monitor** → Se refresca solo cada 60 segundos

**Vos no tenés que hacer nada.** Todo pasa automáticamente.

---

## 📊 HISTORIAL DE COALICIONES (auto-generado)

| Fecha | Score | Agentes | Tiempo | Tarea |
|---|---|---|---|---|
| 2026-05-27 | 81/100 | 5 agentes | 136s | Auditar y mejorar la experiencia del usuario en la landing... |

---

## 🚨 SI ALGO NO FUNCIONA

**La web no arranca:**
```
cd "C:\Users\lucas\OneDrive\Documentos\Claude\Projects\App Desarrollo integral\web"
npm install
npm run dev
```

**El sistema de agentes no responde:**
- Verificar que `.env.local` tiene `ANTHROPIC_API_KEY`
- Verificar que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` están en `.env.local`

**GitHub no actualiza:**
- Verificar conexión a internet
- El script corre automáticamente cuando Claude para

---

## 📝 PENDIENTES / PRÓXIMOS PASOS

### Landing (para mejorar la web)
- [ ] Mover las stats (2400+ atletas) al hero — aumenta confianza
- [ ] Trust badges: SSL + Datos protegidos (AAIP)
- [ ] Agregar headers de seguridad al servidor (CSP, HSTS)
- [ ] Tracking de clicks y scroll para saber qué funciona
- [ ] Video mobile: reemplazar por imagen en pantallas chicas

### Sistema de agentes
- [x] Embeddings reales (Voyage AI) para búsqueda semántica → ✅ Implementado
- [ ] Pantalla visual para ver las coaliciones corriendo
- [x] Más robots: SEO Specialist + Fitness Specialist → ✅ Implementados
- [x] Creative Media Agent (imágenes + videos vía FAL.ai) → ✅ Implementado — falta FAL_API_KEY
- [x] Editor de video con FFmpeg (cortar, highlights automáticos) → ✅ Implementado
- [x] FAL.ai key configurada → ✅ Activa
- [x] Tablas Supabase (video_cuts + video_style_profile) → ✅ Ejecutadas
- [x] Carpetas de media creadas → Videos\DI-Media + OneDrive\DI-Media ✅

### Negocio
- [ ] Definir tablas para datos de clientes en Supabase
- [ ] Integrar formulario de evaluación con la base de datos
