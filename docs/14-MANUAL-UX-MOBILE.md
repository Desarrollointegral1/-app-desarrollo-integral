# Manual de UX Mobile — el patrón para construir apps (agregado 2026-08-03)

> Complementa `12-MANUAL-DIRECCION-WEB.md` (que es para webs/landings). Este es
> para PANTALLAS DE APP — navegación, componentes, estados, feedback táctil.
> Investigación real con fuentes (no opinión ni 2 clicks de Google), citada
> en cada sección. Lo que Charles lee ANTES de tocar una pantalla de app.

## 1 · Los 10 principios que no se negocian

Fuente: [UXCam — Diseño UX para móviles](https://uxcam.com/es/blog/diseno-ux-para-moviles/)

1. **Zona del pulgar**: acciones primarias en los dos tercios inferiores de la pantalla — no arriba.
2. **Área de toque mínima 44pt/48dp** — el error más común y el más caro (frustra sin que el usuario sepa decir por qué).
3. **Onboarding máximo 3-5 pantallas**. Más que eso, se abandona.
4. **Rendimiento ES ux** — un spinner de 3 segundos pesa más que cualquier animación linda.
5. **Errores claros y accionables** — nunca "Error 500", siempre qué pasó y qué hacer.
6. **Guardar estado con generosidad** — el usuario interrumpe la app todo el tiempo (llamada, notificación, se le apaga la pantalla).
7. **Medir comportamiento real** — rage taps, dónde abandona, no solo "se ve lindo".

## 2 · Navegación — cuándo cada patrón (no todos sirven para todo)

Fuentes: [DesignStudioUIUX — Mobile Navigation UX](https://www.designstudiouiux.com/blog/mobile-navigation-ux/) · [Muzli Blog 2026](https://muz.li/blog/whats-changing-in-mobile-app-design-ui-patterns-that-matter-in-2026/)

- **Tabbar plana (3-5 ítems fijos abajo)**: sigue siendo el patrón correcto para navegación PRIMARIA — 21% más rápido que un menú superior, medido. **No se reemplaza porque sí.** Lucas ya lo confirmó: DI App se queda con su tabbar plana — es la decisión correcta, no una concesión.
- **Bottom sheet** (panel que sube desde abajo): el contenedor esperado en 2026 para todo lo que NO merece pantalla completa — filtros, confirmaciones, preview, compartir. Reemplaza al modal centrado clásico.
- **Grid de íconos redondos** (el patrón Afitz/Mercado Pago que le gustó a Lucas): correcto como **accesos secundarios agrupados dentro de una pantalla** (ej. "Módulos" de un dashboard), NO como reemplazo de la navegación primaria. Es del mismo lenguaje visual que usan las fintech (Mercado Pago, Nubank) para "todo lo que podés hacer desde acá" — encaja bien en el home del ADMIN de DI App (Alumnos / Planes / Reportes / Evaluación como accesos, no como tabbar).
- **FAB (botón flotante)**: perdiendo terreno — se prefiere integrar la acción primaria a la barra de navegación en vez de flotarla encima del contenido.

## 3 · Sistema de medidas — 8pt grid

Fuente: [UXPin — Design Tokens](https://www.uxpin.com/studio/blog/what-are-design-tokens/) · [Rejuvenate — 8pt Grid](https://www.rejuvenate.digital/news/designing-rhythm-power-8pt-grid-ui-design)

Escala fija: **4, 8, 12, 16, 24, 32, 48, 64** px para todo espaciado (padding, gap, margin). Nunca un valor suelto como `13px` o `22px` — si algo pide "más espacio", el siguiente escalón de la lista, no un número inventado. Esto es lo que hace que una interfaz se sienta "hecha con sistema" en vez de improvisada pantalla por pantalla.

## 4 · Dark mode — el error más común es el negro puro

Fuente: [Accessibility Checker — Dark Mode](https://www.accessibilitychecker.org/blog/dark-mode-accessibility/) · [Tech-RZ 2026](https://www.tech-rz.com/blog/dark-mode-design-best-practices-in-2026/)

**Nunca `#000000` puro** — cansa la vista y hace que cualquier sombra/elevación sea invisible (no hay contraste posible contra el negro absoluto). El estándar 2026 es un gris muy oscuro: `#121212` a `#1a1a1a`.

**Hallazgo real en tus propias apps** (verificado en el código, no supuesto):
- DI App usa `#070707` — está a mitad de camino, más cerca de negro puro que del estándar recomendado.
- Urquiza usa `#0d0d0f` — más cerca del estándar, bien encaminado.

No es un error grave (82% de usuarios prefieren dark mode, y ambas apps ya lo tienen bien resuelto en general) pero **`#0d0d0f`-`#121212` es el rango correcto** — si en algún momento se retoca la paleta, subir DI App un escalón desde `#070707` es la corrección concreta, no un rediseño.

Contraste mínimo WCAG: 4.5:1 texto normal, 3:1 texto grande — en mobile con luz variable (afuera, sol) conviene apuntar a 7:1 para contenido primario.

## 5 · Estados de carga — nunca un spinner solo

Fuente: [Clay — Skeleton Screens](https://clay.global/blog/skeleton-screen) · [AppyPie — Loading States](https://www.appypie.com/blog/loading-states-mobile-apps)

Un skeleton (placeholder gris con la forma del contenido real) hace sentir la carga más rápida que un spinner, **incluso con el mismo tiempo real de carga** — es percepción, no velocidad real, pero la percepción es lo que importa para el usuario.

- **Skeleton**: para listas y pantallas con contenido (lista de alumnos, historial).
- **Spinner**: solo para operaciones cortas (<2s) sin contenido que previsualizar (ej. "guardando").
- **Shimmer**: cuando lo que carga es una imagen/media.
- Regla dura: **cualquier acción muestra feedback dentro de los primeros 100ms** — aunque sea solo deshabilitar el botón, nunca dejar al usuario sin saber si tocó algo.

Nota sobre lo que Lucas mencionó como "el botón de cargar que me gustó": el patrón correcto que ya tenés instalado en `descargarPdf`/`ScanCorporal` (estado generando/error, botón deshabilitado mientras corre, mensaje si falla) es exactamente esto — earned praise, no casualidad. Es el patrón a repetir en cualquier acción async nueva.

## 6 · Gamificación — aplica con cuidado, no de fábrica

Fuente: [CitrusBits — Duolingo/Strava/Forest](https://citrusbits.com/how-gamification-has-catapulted-duolingo-strava-and-forest-to-the-top-of-their-respective-app-categories/) · [Orizon — Duolingo streaks](https://www.orizon.co/blog/duolingos-gamification-secrets)

Datos medidos (no anécdota): streaks (rachas) suben el compromiso 60%; leaderboards suben el engagement 40%; badges suben la tasa de finalización 30%. Aplica directo a DI App (adherencia al plan) y a Urquiza (asistencia, progresión de cinturón).

**No es "poner una racha por poner"**: el patrón que funciona es *"play first, profile second"* — el valor real (el entrenamiento, la técnica) va primero, la gamificación es una capa liviana encima, nunca el centro de la pantalla. Aplicado a lo que ya existe:
- DI App ya tiene asistencia % — sumarle una racha visible ("3 semanas seguidas entrenando") es una mejora barata con datos que ya están guardados.
- Urquiza ya tiene el camino curricular con progresión — el patrón de badge/hito por técnica dominada encaja con lo que ya construiste, no es nada nuevo que aprender.

## 7 · El error a evitar: copiar el visual sin copiar el motivo

Ninguna referencia (Mercado Pago, Duolingo, Afitz) se copia por estética — se copia el PATRÓN porque resuelve el mismo problema real que tiene DI/Urquiza. Antes de traer un elemento de una app de referencia, la pregunta es: *¿qué problema de USO resuelve acá, no solo cómo se ve?* Si la respuesta es "queda lindo" y nada más, no entra — mismo criterio que ya rige `playbook-anti-cara-de-ia.md` para web, aplicado a mobile.

## 8 · Hallazgos reales en DI App (auditoría completa, 2026-08-03)

Verificado con Chrome real (no supuesto) — login de Lucas + "Modo Entrenador" (ver `?vista=movil`
como vía real para forzar la vista de alumno, documentado en el manifest de DI App).

- **Tabbar del alumno** (`App.jsx:7681`): confirmado por captura real — barra cuadrada, borde a
  borde, sin cápsula, sin sombra, 3 accesos (Historial/Entrenamiento/Luqui), cambio de pestaña sin
  transición. Coincide 100% con lo leído en código. Fix: flotante + indicador que se desliza (ver
  §2).
- **`SkeletonListaAlumnos` importado pero jamás usado** (`App.jsx:91`) — solo `SkeletonCard` está
  conectado (2 veces). Import muerto, mismo patrón que otros huérfanos ya encontrados.
- **`#070707` en `theme.js:96`** — un escalón más oscuro que el rango recomendado `#0d0d0d`-`#121212`.
- **Biblioteca de ejercicios (1343 ítems) — hallazgo corregido (2026-08-03)**: el hallazgo inicial
  ("ilustraciones genéricas de línea, sin foto/video real") era un error de verificación — se basó
  en un solo ejercicio visto en el modal admin. Confirmado con SQL real contra Supabase: **98.6-
  98.7% de los 1343 ítems tienen foto o gif real**, y `CatalogoExplorer.jsx` ya muestra foto real
  por default + gif al hover (decisión de diseño ya construida, 2026-07-30). La mejora real
  disponible es otra: **reclasificación por movimiento** — hay duplicación real (ej. "Press
  Militar" con 8+ filas por variante de equipo) que dificulta encontrar el ejercicio correcto. Ese
  sí es un gap real, pero es un proyecto de clasificación asistida por IA + revisión humana, no un
  fix de UI.
- **Cola "Para revisar (17)"** ya existe como filtro en la biblioteca — un flujo de curación real
  que ya está construido, solo falta que alguien lo vacíe (coincide exactamente con el ~1.3-1.4%
  de ítems sin media real).
- **Racha de asistencia**: ya estaba construida y probada (componente `Asistencia`), pero scopeada
  solo a la vista de rehabilitación — no aparecía para alumnos de entrenamiento normal. Extendida
  al Diario normal el 2026-08-03 (misma lógica, sin duplicar código).
- **Pantalla de login**: la más floja de toda la app según Lucas — campo plano, botón genérico,
  "Acceso administrador" como texto casi invisible, error rojo suelto sin contenedor. Propuesta:
  ícono de marca protagonista, más aire entre campos, el rojo de marca reservado SOLO para error.

## 9 · Comparación Afitz vs DI App — qué copiar y qué no (agregado 2026-08-04)

> **Nota de método — leer antes que el resto de la sección.** Esta comparación se
> hizo desde un entorno remoto cuya política de egress **bloqueó `afitz.com.br`**
> (403 en el CONNECT del proxy, verificado también contra `example.com`: el bloqueo
> es de todo el tráfico directo, no del sitio). **No hay capturas propias de Afitz
> en esta ronda.** Por lo tanto:
>
> - Todo lo que se afirma de **DI App está verificado** contra código real y SQL
>   real contra Supabase, con archivo y línea citados.
> - Todo lo que se afirma de **Afitz viene de dos fuentes secundarias**: la
>   observación directa de Lucas (navegando el sitio él mismo) y material público
>   (web del producto, ficha de Google Play / App Store). Está marcado como tal.
> - Lo que queda **pendiente de verificación visual** está listado al final en §9.6.
>
> Esta distinción no es burocracia: el 2026-08-03 ya hubo un hallazgo de este mismo
> manual que resultó falso por haberse basado en una sola pantalla vista de paso
> (el de "ilustraciones genéricas" en §8). El criterio es no repetirlo.

### 9.1 · El menú "Funcionalidades" (mega menú) — no entra en DI, y el motivo importa

Fuentes: [NN/g — Mega Menus Work Well for Site Navigation](https://www.nngroup.com/articles/mega-menus-work-well/) · [NN/g — Menu-Design Checklist](https://www.nngroup.com/articles/menu-design/) · [IxDF — What are Mega Menus](https://ixdf.org/literature/topics/mega-menus)

Lo que dice la investigación: un mega menú puede reducir hasta **50% los clicks**
para llegar a un contenido; el punto dulce es **3-4 columnas** (más produce *choice
overload*); el techo razonable es ~28-36 links en total; y **cada columna necesita
encabezado de grupo** — Baymard midió 23% más abandono en mega menús sin títulos de
grupo.

**Veredicto para DI: no aplica, y no por falta de ganas sino por diagnóstico.** Un
mega menú resuelve el problema de *"tengo demasiados destinos y no entran en la
navegación"*. Ese problema DI no lo tiene:

- **DI no tiene landing.** Verificado en `index.html`: la app es una PWA que abre
  directo en login, con meta de PWA/OG pero sin ninguna ruta de marketing. El menú
  "Funcionalidades" de Afitz es un patrón de **sitio comercial**, y Afitz lo necesita
  porque vende a personal trainers; DI se entrega a alumnos ya captados.
- **La navegación del alumno son 3 accesos** (Historial / Entrenamiento / Luqui).
  El §2 de este manual ya cerró esa discusión con dato medido: tabbar plana para
  navegación primaria, no se reemplaza porque sí.
- **Del lado admin**, donde sí hay muchos destinos, el §2 ya prescribe otra cosa:
  grid de íconos agrupados, no un desplegable. Traer un mega menú acá sería resolver
  el mismo problema dos veces con dos lenguajes distintos.

**Dónde sí revisitarlo:** el día que se construya una landing comercial de DI (hoy no
existe), esta es la referencia correcta y las cifras de arriba son el criterio.
Anotado como pendiente, no como deuda.

### 9.2 · Callouts flotantes sobre mockups — el globito no; el dato concreto sí

Fuentes: [Screenhance — How to Display Screenshots on Your SaaS Landing Page](https://screenhance.com/blog/saas-landing-page-screenshots) · [Framiq — Make SaaS Screenshots Look Professional](https://framiq.app/blog/make-saas-screenshots-look-professional)

Lo que dice la investigación sobre anotar capturas: **máximo 3 callouts por imagen**
(más y la captura pasa a ser un diagrama), **un solo color de acento**, anotar sólo
lo que no es obvio por sí mismo, y mantener la tipografía/color de la marca.

Igual que §9.1, el globito flotante sobre un mockup de celular es un **patrón de
landing**, no de app — y DI no tiene landing. Copiarlo *como elemento gráfico* sería
exactamente el error que prohíbe el §7 de este manual.

**Pero hay una traducción real y vale la pena.** Lo que hace valioso a un callout
como "2 fotos" o "1 minuto" no es el globito: es que **declara por adelantado cuánto
esfuerzo cuesta la cosa**. Ese principio sí es de app, y DI tiene un hueco concreto
donde aplicarlo:

- **Scan Corporal** (`src/components/ScanCorporal.jsx`, documentado en
  `NOTAS-SCAN-CORPORAL.md`) le pide al alumno 2 fotos + peso/altura/género/edad, y
  llama a una función serverless con `maxDuration: 60`. Es decir: **puede tardar hasta
  un minuto** y requiere sacarse dos fotos. Hoy nada de eso se anuncia antes de
  empezar.
- El §1.3 de este manual (onboarding corto) y el §5 (feedback dentro de los 100ms,
  nunca dejar al usuario sin saber) apuntan al mismo lugar: **el costo se declara
  antes, no se descubre a mitad de camino.**

Traducción concreta: una línea de texto arriba del formulario — *"2 fotos · ~1 minuto
· no guardamos las fotos"* — hace el trabajo del callout de Afitz sin importar su
estética. Y el tercer dato (privacidad) es material real de DI, ya implementado a
propósito según `NOTAS-SCAN-CORPORAL.md`, hoy invisible para el alumno.

### 9.3 · Ficha de ejercicio — el hallazgo fuerte de esta ronda (verificado)

Fuentes: [NN/g — Concise, SCANNABLE, and Objective](https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/) · [NN/g — Be Succinct!](https://www.nngroup.com/articles/be-succinct-writing-for-the-web/) · [UXmatters — Scannability: Principle and Practice](https://www.uxmatters.com/mt/archives/2015/06/scannability-principle-and-practice.php) · [U. of Utah — How Chunking Boosts UX](https://websites.it.utah.edu/announcements/posts/2025/july/chunking.php)

**Primera corrección de rumbo: el archivo a mirar no era el que parecía.**
`CatalogoExplorer.jsx` **no** es donde el alumno ve un ejercicio. Su modal `detalle`
es el **formulario de edición del admin** — el título literal dice "Crear ejercicio
nuevo" / "Editar ejercicio" (`CatalogoExplorer.jsx:1398`) y el campo `instrucciones_es`
ahí es un `<textarea>` (`:1449`). Comparar eso contra la pantalla de detalle de Afitz
sería comparar un panel de carga contra una ficha de consumo.

**Dónde ve el alumno un ejercicio de verdad: `src/components/ItemCard.jsx`.** La
tarjeta se abre y, en `ItemCard.jsx:202-204`, renderiza así:

```jsx
{desc && (
  <div style={{ color: S.gray, fontSize: 15, lineHeight: 1.6, marginBottom: 12 }}>{desc}</div>
)}
```

Un `<div>` plano, gris, sin estructura. Y esto es lo que hay adentro — **SQL real
contra Supabase, proyecto `Desarrollo Integral`, 2026-08-04**:

| Métrica sobre `catalogo_ejercicios` | Valor |
| --- | --- |
| Ejercicios totales | 1343 |
| Con `instrucciones_es` vacías | **0** |
| **Sin un solo salto de línea** | **1343 de 1343** |
| Largo promedio | **493 caracteres** |
| Largo máximo | 990 caracteres |
| Que mencionan algo tipo error/evitar/cuidado | **6 de 1343** |

O sea: **el 100% del catálogo son párrafos corridos de ~493 caracteres, renderizados
en gris a 15px**, para alguien que los lee **de pie, en medio de la serie,
transpirado** — el mismo escenario de uso que en §8 justificó subir los `+/-` al piso
táctil de 44px. La investigación es contundente para ese contexto: NN/g midió que
**79% de los usuarios escanea y sólo 16% lee palabra por palabra**; los estudios de
eye-tracking muestran que **los numerales detienen la mirada** incluso dentro de una
masa de texto que si no se ignoraría; y el troceado (*chunking*) reduce la carga
cognitiva frente al párrafo narrativo.

**El hallazgo que abarata el arreglo:** el texto **ya está escrito como pasos
ordenados**, sólo que no se renderiza como tales. Ejemplo textual de la base
(*"45° prensa de piernas en prensa"*, 669 caracteres):

> "Ajusta el asiento y la placa de la máquina de trineo a una posición cómoda.
> **Siéntate** en la máquina de trineo con la espalda contra el respaldo y los pies
> separados a la altura de los hombros sobre la placa. **Sujeta** las asas a los
> lados del asiento para mayor estabilidad. **Empuja** la placa alejándola de tu
> cuerpo extendien…"

Son imperativos en secuencia. Convertir eso en pasos numerados es **partir por
oración**, no reescribir 1343 fichas. Es un cambio de *render*, barato y reversible.

**Lo que Afitz tiene y DI no puede copiar sólo con render** (según observación de
Lucas, pendiente de verificación visual — ver §9.6):

- **Caja de "Errores Comunes" con ❌** — DI **no tiene ese dato**: sólo 6 de 1343
  filas mencionan algo parecido. Esto **no es un problema de UI, es contenido nuevo**,
  y es un proyecto de redacción (o de IA + revisión humana, igual que la
  reclasificación por movimiento del §8).
- **Tabs de variante de ejecución (Bilateral / Abierto / Unilateral)** — DI hoy
  modela las variantes como **filas separadas del catálogo**, que es exactamente la
  duplicación ya diagnosticada en §8 ("Press Militar" con 8+ filas). Los tabs de
  Afitz son la *interfaz* de una taxonomía que DI todavía no tiene. **Primero la
  reclasificación, después los tabs** — al revés no se puede.

**La conclusión operativa es separar las tres cosas**, que tienen costos muy
distintos: (a) renderizar pasos numerados = barato, datos ya existen; (b) errores
comunes = contenido nuevo; (c) tabs de variante = depende de la reclasificación.

### 9.4 · Botones, color y cards — por qué "se ve más terminado" (y por qué no es la paleta)

**Primero, una corrección al §8 de este manual:** el hallazgo de `#070707` en
`theme.js:96` **ya está corregido**. Hoy `theme.js:99` dice `bg: "#0d0d0d"`, dentro
del rango recomendado, y el comentario del código cita la auditoría del 2026-08-03
como motivo. El manual estaba desactualizado respecto del código.

**Segundo, y es lo importante: el sistema de diseño de DI no es el problema.**
`src/utils/theme.js` tiene niveles de superficie documentados (0 a 3), escala
tipográfica con piso duro de 15px, `TAP = 44` declarado en cada helper interactivo,
grises auditados contra WCAG AA (`lgray` se corrigió el 2026-08-02 de `#5f5f5f` a
`#8a8a8a` por dar 2.67:1) y sombras por nivel. Eso está **por encima del promedio de
apps en producción**. Copiar tokens de Afitz sería un retroceso.

**Lo que falta no son tokens: es aplicación consistente de los que ya existen.**
Evidencia concreta, en el mismo componente que ve el alumno:

- **`ItemCard.jsx` importa `TS` pero usa números sueltos.** Usa `TS.ui` en la línea
  158 y después escribe `fontSize: 15` a mano en las líneas 150, 170, 222 y 223, y
  `fontSize: 18` en 225 y 246. La escala existe y en la misma tarjeta se saltea. Es
  justo lo que el §3 llama "improvisada pantalla por pantalla".
- **El indicador de abrir/cerrar son caracteres de texto** — `{open ? "▲" : "▼"}`
  (`ItemCard.jsx:159`) — mientras el resto de la app usa íconos `lucide`. Un detalle
  chico que lee como "sin terminar" más que cualquier tema de color.
- **La caja blanca de media.** El GIF se muestra sobre `background: "#fff"`
  (`ItemCard.jsx:108`, y lo mismo en `CatalogoExplorer.jsx:1407`): un rectángulo
  blanco puro incrustado en una card oscura. Tiene motivo real (los GIFs del dataset
  vienen con fondo blanco), pero el resultado es el elemento de mayor contraste de
  toda la pantalla puesto en algo que no es la acción principal.

**Y tercero, el sesgo de comparación:** una landing es **una composición
controlada de una sola pantalla, sin estados**. Una app real tiene vacío, carga,
error, offline, nombre largo, texto de 990 caracteres. Afitz "se ve más terminado"
en parte porque se está comparando su mejor pantalla curada contra el uso real de
DI. La comparación honesta es contra la app de Afitz, no contra su home.

**Lo que NO se copia:** el naranja. El Brand Kit v1.0 ya fijó rojo como acento único
y verde reservado a estado real; el §7 de este manual ya prohíbe traer estética sin
motivo de uso. La paleta de DI no está en discusión en esta ronda.

### 9.5 · Resumen — qué se lleva DI de Afitz

| Patrón de Afitz | ¿Entra en DI? | Por qué |
| --- | --- | --- |
| Mega menú "Funcionalidades" | **No** | Patrón de landing; DI no tiene landing y su nav ya está resuelta (§2). Revisitar si se construye sitio comercial. |
| Callouts flotantes en mockups | **No como gráfico** | Pero sí el principio: declarar el costo por adelantado (Scan Corporal: "2 fotos · ~1 min · no guardamos las fotos"). |
| Pasos numerados "Cómo Ejecutar" | **Sí** | El dato ya está y ya viene en forma de pasos. Cambio de render, barato. Máximo respaldo de investigación. |
| Caja "Errores Comunes" ❌ | **Sí, pero es contenido** | Sólo 6/1343 fichas lo tienen. No es UI: es un proyecto de redacción. |
| Tabs de variante de ejecución | **Bloqueado** | Depende de la reclasificación por movimiento del §8. Primero la taxonomía. |
| Paleta / naranja | **No** | Prohibido por §7 + Brand Kit v1.0. |

### 9.6 · Pendiente de verificar (no dar por cierto hasta confirmarlo)

Lo siguiente **no pudo verificarse en esta ronda** por el bloqueo de red y queda
explícitamente marcado como no confirmado:

1. La estructura real del submenú "Funcionalidades" de Afitz (¿2 columnas?,
   ¿cuántos ítems?, ¿tiene encabezados de grupo?) — importa porque el criterio de
   Baymard/NN/g depende justamente de eso.
2. Los textos exactos de los callouts ("15 segundos", "1 minuto", "2 fotos") y a qué
   feature acompaña cada uno.
3. La pantalla de detalle de ejercicio de Afitz: si los tabs son Bilateral/Abierto/
   Unilateral, cómo se numeran los pasos, y qué formato tiene la caja de errores.
4. Cualquier medición de contraste/tamaño sobre la UI de Afitz.

Para cerrarlos alcanza con capturas propias de Lucas o correr esta comparación desde
un entorno con salida a internet. **Hasta entonces, los puntos 1-4 son observación de
Lucas, no hallazgo verificado de este manual.**

---

*Fuentes completas citadas en cada sección — investigación real del 2026-08-03 (§1-§8) y del 2026-08-04 (§9), no una guía genérica de blog.*
