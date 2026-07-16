# Desarrollo Integral — Web Project

> Este archivo es específico de esta carpeta. Las reglas globales de trabajo con Lucas están en `~/.claude/CLAUDE.md`.

---

## Qué es este proyecto

Sitio web premium para **Desarrollo Integral** — servicio interdisciplinario que combina entrenamiento físico (Ariel) + osteopatía/kinesiología (Griselda). Gimnasio Team 360 Belgrano, Buenos Aires.

**Referencia de marca**: Equinox, Skulpt. Dark premium, minimal, autoridad con calidez.

---

## Stack

- **Framework**: Next.js 16 (App Router) — leer `node_modules/next/dist/docs/` antes de escribir código, tiene breaking changes.
- **UI**: React 19 + TypeScript strict
- **Estilos**: Tailwind 4
- **Animaciones**: Framer Motion + GSAP
- **DB/Auth**: Supabase
- **Deploy**: Vercel

---

## Design System (resumen — ver DESIGN.md para completo)

### Colores clave
- **Gold**: `#C8A96E` — color primario de marca
- **Background**: `#0A0A0A` — base
- **Text**: `rgba(255,255,255,0.95)` principal / `rgba(255,255,255,0.60)` secundario

### Tipografía
- **PP Formula** (Pangram) — weights: 300, 400, 500, 600, 700, 900
- Fallback: system-ui
- Archivos en `/public/fonts/pp-formula/`

### Animaciones
- UI transitions: 150–250ms ease-out
- No superar 300ms para elementos de UI
- Hero/marketing: hasta 1.2s (one-time, cinematográfico)
- Easing base: `cubic-bezier(0.23, 1, 0.32, 1)`

---

## Estructura del Proyecto

```
app/
  page.tsx              — Home (landing principal)
  layout.tsx            — Root layout
  globals.css           — Estilos globales
  data.ts               — Datos de contenido
  components/           — Componentes del sitio
    NavBar.tsx
    HeroSection.tsx
    MethodSection.tsx
    IdentitySection.tsx
    ManifiestoSection.tsx
    LocationSection.tsx
    CTAForm.tsx
    Footer.tsx
    GriselidaCrosslink.tsx
  osteopatia/           — Página de Griselda
  about/                — Sobre nosotros
  contact/              — Contacto
  studios/              — Estudios
  api/                  — API routes
    coalition/          — Charles (sistema de agentes)
    leads/              — CRM de leads
    brains/             — Brain Factory
    webhooks/           — Integraciones externas

lib/
  parallel-agents.ts    — Motor de ejecución de coalición
  context-collector.ts  — Recolección de contexto automático
  model-selector.ts     — Selector de modelo por agente
  supabase-agents.ts    — Cliente Supabase para agentes
  coalition-monitor.ts  — Dashboard de salud del sistema
  agent-tools.ts        — Tools del Code Specialist
  charles-adapter.ts    — Adaptador de Charles
```

---

## Sistema Charles (motor de agentes)

Este proyecto tiene un sistema de agentes coordinado llamado **Charles** que ya está implementado y en funcionamiento.

**Endpoint principal**: `POST /api/coalition/stream` con `{ "task": "tarea en castellano" }`
**Monitor**: `GET /api/coalition/monitor`
**Dashboard**: `http://localhost:3000/monitor`

Los **8 agentes** activos: Design Specialist, Performance Specialist, Security Specialist, Code Specialist, Content Specialist, Research Specialist, Media Specialist, Analytics Specialist.

Para tareas de desarrollo que involucren a Charles, leer `lib/parallel-agents.ts` primero.

---

## Reglas de Desarrollo

### Antes de escribir código
1. Leer el archivo que vas a modificar completo.
2. Si toca animaciones: respetar las curvas y tiempos del design system.
3. Si toca colores: usar las variables del design system, no valores hardcodeados.

### TypeScript
- Strict siempre. Sin `any`.
- Código completo — no fragmentos con `// TODO` o `// resto del código`.

### Después de escribir código
1. Verificar que el archivo existe en disco.
2. Correr `npx tsc --noEmit` para TypeScript.
3. Si hay dudas de build: `npm run build`.

### Git
- Nunca `git add -A` — si hay dos sesiones abiertas, una le pisa el trabajo a la otra.
- Siempre: `git add [archivo específico]`.

---

## Estado Actual del Proyecto

- **Sitio web**: En desarrollo activo. Desplegado en Vercel.
- **App de gestión de alumnos**: Existe, construida con Lovable. Separada de este repo.
- **Charles (sistema de agentes)**: Implementado. Funcional.
- **Supabase**: Conectado. Tablas de coalición, leads, y memoria de agentes activas.

---

## Personas Clave

- **Lucas** — dueño del proyecto, coordina todo
- **Ariel ("Ari")** — entrenamiento físico, co-fundador
- **Griselda ("Grey")** — osteopatía/kinesiología, co-fundadora (tiene su propia página `/osteopatia`)
- **Pope ("el pelado")** — instructor BJJ/MMA

---

*Actualizado: 2026-07-08*
