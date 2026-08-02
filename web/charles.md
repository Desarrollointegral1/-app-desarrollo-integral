# Charles — Manifest: DI Web (landing/marketing)

> Fuente de verdad operativa de este proyecto para el orquestador Charles
> (`C:\Users\lucas\.claude\skills\charles\SKILL.md`). Se versiona con el código:
> si cambia el stack, una ruta o la marca, este archivo se actualiza en el mismo commit.

- **Slug**: `di-web`
- **Estado**: activo — ATENCIÓN: Lucas declaró una pausa de la web/marketing el 2026-07-29; antes de tocar archivos de acá, confirmar en UNA línea que la pausa se levantó.
- **Raíz**: `C:\Users\lucas\OneDrive\Documentos\Claude\Projects\App Desarrollo integral\web\` (subcarpeta del repo cuya RAÍZ es la app de gestión — otro proyecto)
- **Stack**: Next.js 16 + React 19 + TypeScript strict + Tailwind 4 + Framer Motion + GSAP. Tailwind 4 configura por CSS (`@theme` en `app/globals.css`) — NO existe `tailwind.config.ts`, no buscarlo ni crearlo.
- **Verificación**: `npx tsc --noEmit` + `npm run lint` desde `web\`
- **Prod**: https://desarrollointegral.app/web (mismo deploy: `luquigivi.vercel.app/web`; el proyecto tiene `basePath: '/web'` — la raíz bare da 404 a propósito, siempre entrar con `/web`)
- **Deploy**: commit + push al repo (GitHub `Desarrollointegral1/-app-desarrollo-integral`, Vercel deploya solo); alternativa: MCP de Vercel (teamId `desarrollointegral1s-projects`). Política: la define Charles.
- **La tarea dice**: web, sitio, landing, página, hero, navbar, sección, SEO, luquigivi, desarrollointegral.app
- **Marca**: Brand Kit DI — `G:\Mi unidad\Cerebro\desarrollo-integral\marca\claude-design\BRAND-KIT-DESARROLLO-INTEGRAL.md`. Familia de dirección web: "Centro" (manual: `G:\Mi unidad\Cerebro\banco-de-referencias\12-MANUAL-DIRECCION-WEB.md`).
- **Contexto base** (leer siempre): `app/globals.css`, `app/layout.tsx`
- **Contexto por tarea**: navbar/menú → `app/components/NavBar.tsx` / `NavDrawer.tsx`; hero → `app/components/HeroSection.tsx`; landing completa → todos + `app/page.tsx`; otra sección → Glob `app/components/*[Nombre]*`
- **Cuidados**: comparte repo con DI App (la raíz) — ningún edit ni build de este proyecto sale de `web\`. Los docs `CHARLES-*.md` y `web/lib/parallel-agents.ts` de esta carpeta son el motor viejo del servidor de coaliciones, no parte de la landing — **dado de baja formal el 2026-08-02** (lo reemplaza el workflow de Charles). La limpieza física de esos archivos está pendiente en PLAN-MAESTRO, bloqueada por la pausa de la web: no borrarlos como parte de otra tarea.
