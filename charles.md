# Charles — Manifest: DI App (gestión de alumnos)

> Fuente de verdad operativa de este proyecto para el orquestador Charles
> (`C:\Users\lucas\.claude\skills\charles\SKILL.md`). Se versiona con el código:
> si cambia el stack, una ruta o la marca, este archivo se actualiza en el mismo commit.

- **Slug**: `di-app`
- **Estado**: activo
- **Raíz**: `C:\Users\lucas\OneDrive\Documentos\Claude\Projects\App Desarrollo integral\` (la RAÍZ es la app; la subcarpeta `web\` es OTRO proyecto — ver Cuidados)
- **Stack**: Vite 5 + React 18 + Supabase — JavaScript, sin TypeScript (no migrar sin pedido)
- **Verificación**: `npm run build` desde la raíz
- **Prod**: https://app-desarrollo-integral.vercel.app · **Dev**: localhost:5173
- **Deploy**: commit + push al repo (GitHub `Desarrollointegral1/-app-desarrollo-integral`, Vercel deploya solo); alternativa: MCP de Vercel (teamId `desarrollointegral1s-projects`). Política: la define Charles (checks verdes → directo, sin preguntar; nunca un deploy que la tarea no pedía).
- **La tarea dice**: app, alumnos DI, gestión, bioimpedancia, planes, coach
- **Marca**: Brand Kit DI — `G:\Mi unidad\Cerebro\desarrollo-integral\marca\claude-design\BRAND-KIT-DESARROLLO-INTEGRAL.md`. Esta app es EL estándar de terminación del ecosistema (seguridad, diseño, estructura).
- **Contexto base** (leer siempre): `App.jsx` (ojo: monolito grande — leer por secciones), `services/supabase.js`, `index.html`
- **Contexto por tarea**: lo que aplique de `src/` (Glob `src/**/*[Nombre]*`); hay `graphify-out/` en la raíz — consultar el grafo antes de leer archivos sueltos
- **Backend**: Supabase con RLS real y login vía RPC con hash + rate-limit — no tocar la seguridad sin leer `G:\Mi unidad\Cerebro\creacion-de-apps\playbook-seguridad-supabase.md`
- **Cuidados**: comparte carpeta con DI Web (`web\`) — la guardia de rutas de Charles existe por esto: ningún edit ni build de este proyecto entra a `web\`, y viceversa.
