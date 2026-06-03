# 🏋️ Desarrollo Integral — Sistema Completo

Centro de entrenamiento premium en Belgrano, Buenos Aires. Sistema completo con **Landing Page + Brain Factory (4 brains especializados) + Charles (7 agentes IA)**.

**Estado:** 🟢 **Operativo y Producción-Ready**  
**Última actualización:** 2026-06-03  
**Deploy:** ✅ Vercel (Build pasando sin errores)

---

## 🧠 **Qué Tenés en Este Proyecto**

### 1. **Brain Factory — 4 Brains Especializados**
Sistema de knowledge bases con NotebookLM-py + Supabase. Cada brain es un experto en su dominio:

```
🏋️ Gimnasio         → Métodos, equipamiento, biomecánica
🍎 Nutrición        → Macros, dietas, suplementación  
🏥 Fisioterapia     → Lesiones, rehabilitación, prevención
🧠 Desarrollo Int.  → Metodología integral del centro
```

**Cómo funciona:**
```bash
POST /api/brains/query
{
  "brainId": "brain-nutrition",
  "query": "¿Calorías óptimas para ganancia muscular?"
}
```

**GitHub Sync automático:** Cambios en Obsidian → GitHub → Brain Factory actualizado cada 6 horas (prod) / 1 hora (dev)

---

### 2. **Charles — Orquestador de 7 Agentes IA**
Sistema autónomo que resuelve tareas complejas usando especialistas:

```bash
/charles mejora mi navbar, hazlo premium
```

**Qué hace Charles:**
1. ✅ Lee tu proyecto
2. ✅ Selecciona 3-6 agentes especializados (de 350+ skills)
3. ✅ Los ejecuta en paralelo
4. ✅ Implementa cambios en código
5. ✅ QA automático (TypeScript + ESLint)
6. ✅ Auto-itera si score < 75/100
7. ✅ Aprende patrones para tareas futuras

**Los 7 Agentes:**
| Agente | Emoji | Especialidad |
|--------|-------|-------------|
| Design Specialist | 🎨 | UI/UX, visual, premium |
| Performance Specialist | ⚡ | Velocidad, Lighthouse |
| Security Specialist | 🔒 | Auditoría, vulnerabilidades |
| Code Specialist | 💻 | Implementación, refactorización |
| Content Specialist | ✍️ | Copy, SEO, mensajería |
| Research Specialist | 🔍 | Benchmarks, competencia |
| Media Specialist | 🎥 | Video, imágenes, assets |

---

### 3. **Landing Page (Next.js 16 + React 19)**
Premium, minimalista, dark theme con gold accent.

**Características:**
- ✅ Hero con animaciones GSAP/Framer Motion
- ✅ 10 secciones de contenido
- ✅ Formulario de captura de leads
- ✅ Responsive (mobile + tablet + desktop)
- ✅ Supabase integration para leads
- ✅ Métrica actuales: Lighthouse 78, FCP 2.1s

---

## 📋 Estructura del Proyecto

```
Desarrollo Integral/
│
├── web/                          # 🎨 Landing page (Next.js 16)
│   ├── app/
│   │   ├── page.tsx              # Home
│   │   ├── layout.tsx            # Root + Brain Factory init
│   │   ├── components/           # 13 componentes React
│   │   └── api/
│   │       ├── brains/           # Brain Factory API
│   │       │   ├── route.ts      # POST crear, GET listar
│   │       │   ├── [id]/route.ts # GET brain específico
│   │       │   └── query/route.ts# POST consultar
│   │       └── coalition/        # Charles API
│   ├── lib/
│   │   ├── brain-factory/        # 🧠 Sistema de brains
│   │   ├── parallel-agents.ts    # Motor de Charles
│   │   └── agent-tools.ts        # Tools para agents
│   └── docs/
│       ├── ESTADO-ACTUAL-JUNIO-2026.md  # 📊 Documentación completa
│       ├── CEREBRO.md                    # Sistema de agentes
│       └── ARQUITECTURA-CHARLES.md       # Arquitectura de Charles
│
├── supabase/                     # 🗄️ PostgreSQL + pgvector
│   └── migrations/
│       └── 001_brain_factory_schema.sql
│
└── docs/                         # 📚 Documentación
```

---

## 🚀 Instalación Local

### Landing + Brain Factory + Charles (Next.js)
```bash
cd web
npm install
npm run dev        # http://localhost:3000
npm run build
```

**URLs locales:**
- App: http://localhost:3000
- Monitor de agentes: http://localhost:3000/monitor
- Brain Factory API: http://localhost:3000/api/brains
- Charles API: http://localhost:3000/api/coalition

### Variables de Entorno (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tlxkghpytznkxgqslqzj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_key

# Anthropic API (para Charles)
ANTHROPIC_API_KEY=tu_api_key

# Google Generative AI (para Brain Factory)
GOOGLE_API_KEY=tu_api_key

# GitHub (para webhooks y sync)
GITHUB_TOKEN=tu_token
NEXT_PUBLIC_GITHUB_OWNER=Desarrollointegral1
NEXT_PUBLIC_GITHUB_REPO=-app-desarrollo-integral
```

---

## 💡 Cómo Usar Charles (Tu Asistente IA)

**Invoca desde cualquier lugar** (CLI, notebook, o integración):

```bash
# En el proyecto:
curl -X POST http://localhost:3000/api/coalition \
  -H "Content-Type: application/json" \
  -d '{"task": "mejora mi navbar con estilo premium"}'

# O directamente en el chat:
/charles rediseña la sección de servicios
/charles optimiza la velocidad del sitio
/charles analiza por qué el bounce rate es alto
/charles crea un nuevo brain de especialistas
```

**Ejemplos reales:**
```
/charles mejora el hero section — hazlo premium y agrega animaciones
/charles arregla los errores de TypeScript en el proyecto
/charles audita la seguridad de la aplicación
/charles optimiza las imágenes y reduce bundle size
```

**Resultado esperado:**
- 🎨 Design Specialist propone specs visuales
- ⚡ Performance Specialist optimiza para Lighthouse
- 🔒 Security Specialist audita vulnerabilidades
- 💻 Code Specialist implementa cambios en disco
- ✍️ Content Specialist mejora copy
- 🔍 Research Specialist investiga competencia
- 🎥 Media Specialist optimiza assets

Charles genera un **score de calidad** (0-100) para cada resultado:
- **Score ≥ 75** → Resultado aprobado, se guarda el patrón para futuras tareas
- **Score < 75** → Se re-ejecuta automáticamente hasta lograrlo (máx 3 intentos)

---

## 🎥 Features Principales

✅ **Landing Page** Premium, responsive, con formulario de captura  
✅ **Brain Factory** 4 brains especializados con GitHub sync automático  
✅ **Charles** Orquestador de 7 agentes IA con auto-aprendizaje  
✅ **Supabase** PostgreSQL + pgvector para embeddings  
✅ **Next.js 16** Stack moderno, TypeScript strict  
✅ **Vercel** Deploy automático desde GitHub  

---

## 📊 Métricas Actuales

| Métrica | Valor | Target |
|---------|-------|--------|
| **Lighthouse Performance** | 78 | 95+ |
| **FCP (First Contentful Paint)** | 2.1s | 0.8s |
| **CTA Click Rate** | 4.2% | 8%+ |
| **Mobile Bounce Rate** | 42% | 18% |
| **Charles Score Promedio** | 81-92 | 85+ |
| **Build Time** | < 60s | ✅ Passing |

---

## 🌐 URLs de Producción

| Recurso | URL |
|---------|-----|
| **App Landing** | https://desarrollo-integral.vercel.app |
| **GitHub Repo** | https://github.com/Desarrollointegral1/-app-desarrollo-integral |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj |
| **Vercel Deployments** | https://vercel.com/desarrollointegral1s-projects/desarrollo-integral |

---

## 📚 Documentación Completa

**Acceso a toda la documentación:**

1. **[ESTADO-ACTUAL-JUNIO-2026.md](./web/docs/ESTADO-ACTUAL-JUNIO-2026.md)** — Estado actual del proyecto
2. **[CEREBRO.md](./web/docs/CEREBRO.md)** — Sistema de 8 agentes
3. **[ARQUITECTURA-CHARLES.md](./web/docs/ARQUITECTURA-CHARLES.md)** — Arquitectura de Charles
4. **[DESARROLLO-INTEGRAL.md](./web/docs/DESARROLLO-INTEGRAL.md)** — Info del negocio y stack

---

## 🔧 Troubleshooting

### Build falla en Vercel
**Problema:** Turbopack no puede procesar binarios
**Solución:** Asegurar que Root Directory en Vercel está configurado a `web`

### Brain Factory no sincroniza
**Problema:** GitHub webhooks no se disparan
**Solución:** Verificar `GITHUB_TOKEN` en variables de entorno + permisos en repo

### Charles no responde
**Problema:** API no contesta
**Solución:** Verificar `ANTHROPIC_API_KEY` y que el servidor esté en http://localhost:3000

---

## 🚀 Stack Tecnológico

- **Frontend:** Next.js 16.2.4, React 19.2.4, TypeScript, Tailwind CSS 4
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (Supabase) + pgvector
- **AI/ML:** Anthropic Claude (Charles), Google NotebookLM (Brain Factory)
- **Deploy:** Vercel
- **Versionado:** GitHub + Git
- **Styles:** Tailwind CSS 4, Framer Motion, GSAP
- **Fonts:** PP Formula (custom)

---

## 📞 Stack & Recursos

- **Docs Supabase:** https://supabase.com/docs
- **Next.js:** https://nextjs.org/docs
- **Vercel:** https://vercel.com/docs
- **Anthropic Claude:** https://claude.ai
- **Tailwind CSS:** https://tailwindcss.com

---

**Desarrollado con Next.js, React, Supabase, Anthropic Claude y Tailwind CSS**  
**Última actualización:** 2026-06-03  
**Status:** 🟢 Operativo y Producción-Ready
