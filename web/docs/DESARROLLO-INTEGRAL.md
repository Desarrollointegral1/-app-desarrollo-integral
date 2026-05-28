# 🏋️ DESARROLLO INTEGRAL — Centro de Entrenamiento Premium
**Última actualización:** 2026-05-28
**Ubicación:** Belgrano, Buenos Aires, Argentina

---

## El Negocio

**Desarrollo Integral** es un centro de entrenamiento personalizado premium ubicado en Belgrano. El diferenciador central es el método basado en datos: no entrenamientos genéricos, sino programas construidos a partir de una evaluación inicial exhaustiva y seguimiento continuo de métricas.

**Propuesta de valor:**
- Entrenamientos personalizados en 90 días
- Basados en datos, no en suposiciones
- 2,400+ atletas entrenados (dato validado por coalición de agentes)
- Método propio, sin rutinas genéricas de gimnasio

**Target:**
- Perfil: profesionales urbanos 28-45 años, Belgrano y zonas premium de CABA
- Buscan resultados reales con seguimiento profesional
- Dispuestos a pagar por calidad y personalización

---

## Lucas — El Entrenador

**Rol:** Fundador y head trainer de Desarrollo Integral  
**Email:** carolina@giversolutions.com  
**Perfil:** Entrenador especializado en metodología de datos aplicada al fitness

**Expertise:**
- Evaluación física inicial → datos base para el programa
- Diseño de programas personalizados por objetivos
- Seguimiento iterativo de métricas
- Educación del cliente sobre su propio proceso

---

## Stack Tecnológico

### Web Principal (Landing)
```
Next.js 16.2.4
React 19.2.4
Tailwind CSS 4
Framer Motion (animaciones)
GSAP (animaciones avanzadas)
TypeScript

Ruta: C:\Users\lucas\OneDrive\Documentos\Claude\Projects\App Desarrollo integral\web
Deploy: Vercel (producción)
```

### App Complementaria (Vite)
```
Vite + React 18
Supabase (PostgreSQL)
TypeScript

Ruta: C:\Users\lucas\OneDrive\Documentos\Claude\Projects\App Desarrollo integral
```

### Base de Datos
```
Supabase (PostgreSQL)
Project: tlxkghpytznkxgqslqzj
URL: https://tlxkghpytznkxgqslqzj.supabase.co

Tablas de negocio: (pendiente definir)
Tablas de agentes: agent_registry, coalition_history, learning_patterns, agent_events, files_written
pgvector: habilitado → task_embedding vector(1536) + índice HNSW
```

---

## Diseño y Marca

### Paleta de colores
```css
/* Primario */
--gold: #C8A96E;          /* Dorado premium — CTA, highlights, accents */
--black: #0a0a0a;         /* Fondo oscuro base */
--white: #ffffff;         /* Texto principal sobre fondo oscuro */

/* Secundarios */
--zinc-500: texto secundario
--zinc-400: texto terciario
--white/10: bordes sutiles
--white/5: cards y superficies
```

### Tipografía
- Fuente custom: PP Formula (o similar)
- Weights utilizados: 300 (Light), 600 (SemiBold)
- **Nota performance:** reducir a 2 weights mejora FCP 600ms

### Estilo visual
- Dark theme absoluto
- Premium, mínimalista
- Sin ruido visual — jerarquía clara
- Gold como único color de acento

---

## Componentes de la Landing

### Estructura actual de secciones
```
/                          ← Landing principal
├── HeroSection            ← Video bg + H1 + CTA principal
├── StatsGrid             ← Métricas (2,400+ atletas, etc.)
├── [Identidad/Método]    ← Diferenciadores del método
├── [Testimonios]         ← Prueba social
├── CTAForm               ← Formulario de contacto/evaluación
└── Footer

/monitor                  ← Dashboard de salud de agentes (interno)
```

### Componentes clave
| Componente | Ubicación | Estado |
|---|---|---|
| `HeroSection.tsx` | `app/components/` | ✅ Actualizado por coalición (2026-05-27) |
| `NavBar/NavDrawer.tsx` | `app/components/` | ✅ Con hamburger mobile |
| `CTAForm` | `app/components/` | Pendiente optimización |
| `StatsGrid` | `app/components/` | Pendiente mover above-fold |
| `TrustBadge` | Pendiente crear | 🔲 Sugerido por coalición |

---

## Métricas de Performance (Objetivos)

| Métrica | Estado actual | Target |
|---|---|---|
| Lighthouse Performance | 78 | 95+ |
| FCP (First Contentful Paint) | 2.1s | 0.8s |
| CTA click rate | 4.2% | 8%+ |
| Mobile bounce rate | 42% | 18% |
| LCP | ~2.5s | 1.2s |

---

## URLs y Links Clave

```
Dev server:         http://localhost:3000
Monitor agentes:    http://localhost:3000/monitor
API coalición:      http://localhost:3000/api/coalition
Supabase dashboard: https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj
```

---

## Historial de Mejoras (Log)

### 2026-05-27
**Coalición de agentes — Auditoría UX Landing**
- Score: 81/100
- Agentes: Design + Security + Analytics + Performance + Code
- Archivo modificado: `app/components/HeroSection.tsx`
- Hallazgos principales:
  - Dual CTA confundía al usuario → eliminado, single CTA
  - Gold #C8A96E fallaba contrast ratio WCAG (3.2:1 vs 4.5:1 requerido)
  - StatsGrid debería estar above-fold para trust temprano
  - Video hero causaba 42% mobile bounce → lazy load sugerido
  - Ausencia de headers de seguridad (CSP, HSTS)
  - Analytics: sin event tracking en CTAs o scroll depth

**Sistema de agentes — Construcción completa**
- Motor de coalición operativo (8 agentes, Promise.all)
- pgvector confirmado en Supabase (HNSW + RPC find_patterns_by_vector)
- Monitor dashboard en /monitor
- Endpoint /api/coalition/apply para materializar archivos

---

## Pendientes Técnicos

### Landing (prioridad alta)
- [ ] Mover StatsGrid above-fold (junto al hero)
- [ ] Implementar TrustBadge component (SSL + AAIP/GDPR)
- [ ] Agregar headers de seguridad en `next.config.ts` (CSP, HSTS)
- [ ] Event tracking en CTAs y scroll depth
- [ ] Lazy load video en mobile (reemplazar por imagen estática < 375px)
- [ ] Reducir fonts síncronos de 5 a 2 weights

### App (secundario)
- [ ] Definir tablas de negocio en Supabase (clientes, programas, métricas)
- [ ] RLS (Row Level Security) para datos de clientes

### Sistema de agentes
- [ ] Embeddings reales con OpenAI text-embedding-3-small
- [ ] UI para lanzar coaliciones y ver resultados en tiempo real
- [ ] Más agentes: SEO Specialist, Fitness Copy Specialist

---

## Notas de Negocio

### Posicionamiento
- No competir por precio → competir por resultado y método
- Differentiador: "basado en datos" (vs intuición de gym tradicional)
- Premium urbano de Belgrano: cliente exigente que paga por expertise

### Conversión
- CTA principal: "Evaluación gratuita — 30 min" (presencial, sin cargo)
- Punto de entrada → evaluación física → programa personalizado → seguimiento
- La evaluación es el gancho → reduce fricción inicial

### Copy key
- "90 días" → timeframe concreto, genera expectativa realista
- "2,400+ atletas" → prueba social con número específico
- "Datos reales" → diferenciador vs gimnasio genérico
- "Sin suposiciones" → propuesta negativa que reencuadra la competencia
