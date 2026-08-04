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

## 9 · Comparación Afitz vs DI App — inventario, veredictos e implementación (2026-08-04)

> **Nota de método.** La primera pasada de esta sección se escribió con
> `afitz.com.br` **bloqueado** por la política de egress del entorno de build
> (403 en el CONNECT; el bloqueo alcanza a todo el tráfico directo). Ese mismo
> día Lucas aportó **5 capturas reales** de la app y la landing de Afitz, así
> que §9.1 pasó de "observación sin confirmar" a **inventario verificado sobre
> imagen**. El sitio sigue sin ser alcanzable desde el entorno: **lo que no
> aparece en esas 5 capturas sigue sin verificar** y está marcado como tal.
>
> Todo lo de DI está verificado contra código y SQL real, con archivo y línea.

### 9.1 · Inventario de Afitz — todo lo que se ve, no sólo lo que saltaba a la vista

La primera versión de esta sección se quedó en tres patrones. Revisando las
capturas con detalle hay bastante más, y conviene tenerlo listado entero antes
de decidir qué entra:

**Pantalla "Detalhes do Exercício"**

| Elemento | Detalle |
| --- | --- |
| Reproductor de video | Controles propios: velocidad, retroceso 10s, pausa, tiempo, mute |
| Tabs de variante | `Bilateral` / `Aberto` / `Unilateral` — un video por variante |
| `+ Adicionar vídeo` / `Gerenciar` | El entrenador sube **su propio** video por ejercicio |
| Corazón de favorito | Marcar ejercicio, arriba a la derecha |
| Chips de músculo | `GLÚTEOS` `COXA` bajo el nombre |
| Fila meta en 2 columnas | `Equipamentos: Máquina` \| `Dificuldade: Médio` |
| "Como Executar" | Pasos numerados con **línea de tiempo conectora** entre círculos |
| "Erros Comuns" | Card aparte, con ⚠ y viñetas ❌ |

**Pantalla "Detalhes do Aluno" (vista del entrenador)**

| Elemento | Detalle |
| --- | --- |
| Dock de íconos redondos | `Iniciar Treino` `Treinos` `Evolução` `Calendário` `Avaliação` |
| Tira "Esta Semana" | Un chip por día con **estado**: ✕ falta, hoy resaltado, futuro apagado |
| "Evolução Física" | 2 stat cards con **sparkline + delta**: `PESO 71.0kg +11.0kg`, `GORDURA 12.0% -4.0%`, con ventana ("últimos 9.9 meses") |
| "Notifique" | Acciones rápidas con emoji — `Parabenizar` `Saudade` `Cobrança` `Motivar` — **con cooldown visible** ("11h 44min") |

**Pantalla "Meu Treino" (alumno)**

| Elemento | Detalle |
| --- | --- |
| Fila de ejercicio | Thumbnail + nombre + chip de músculo + **chip de series (`3x8-10`)** + **chip de descanso (`90s`)** |
| CTA principal | `Iniciar Treino` — sesión guiada, no sólo lista |
| Tabbar | `Treino` / `Cardio` / `Evolução` |
| Secundario | `Ver Histórico`, fecha de creación del plan |

**Landing** — 4 cards de feature: *Vídeo de execução rápida*, *Mini aula
explicativa*, *Descrição textual passo a passo*, *Erros comuns e como evitá-los*.
Es la promesa comercial de la misma pantalla de ejercicio de arriba.

### 9.2 · Contra DI: qué ya tenemos, qué falta y qué no aplica

| Patrón de Afitz | Estado en DI | Veredicto |
| --- | --- | --- |
| Pasos numerados "Cómo ejecutar" | Era un párrafo gris | ✅ **Implementado** (§9.3) |
| Declarar el costo por adelantado | El dato existía, enterrado en prosa a 11px | ✅ **Implementado** en Scan Corporal |
| Dock de íconos redondos | **Ya existe** — `IconDock`, commit `8cf9f2a` | Ya resuelto, y el §2 ya lo prescribía |
| Racha / asistencia | **Ya existe** — componente `Asistencia`, extendido al Diario el 2026-08-03 | Ya resuelto |
| Video propio del entrenador por ejercicio | **Ya existe** — `SubirVideoInline`, bucket `ejercicios-videos` | Ya resuelto |
| Evolución con gráfico | **Ya existe** — `MiniChart`, `EvolucionCargas`, `ResumenMensual` | Existe; falta el formato *stat card con delta* |
| Tira semanal con estado por día | Hay asistencia, no la tira | Gap real, chico |
| Chips de series/descanso en la fila | **Columnas muertas** (§9.5) | Bloqueado: falta el alta |
| Sesión guiada "Iniciar Treino" | No existe | Proyecto grande, no un fix de UI |
| Nudge del entrenador con cooldown | No existe (Luqui es coach→alumno, no entrenador→alumno) | Candidato interesante, decisión de producto |
| Caja "Errores Comunes" | **6 de 1343 fichas** tienen el dato | Bloqueado: es contenido, no UI |
| Tabs de variante de ejecución | Las variantes son **filas separadas** del catálogo | Bloqueado por la reclasificación del §8 |
| Equipamiento / Dificultad del ejercicio | **El dato existe** (`equipment_es`, `nivel`) pero nunca llega al alumno | Gap real, barato — pendiente |
| Favorito por ejercicio | No existe | Bajo valor para DI (el plan lo arma el entrenador) |
| Paleta naranja | — | ❌ No se copia (§7 + Brand Kit v1.0) |

### 9.3 · La ficha de ejercicio — el hallazgo fuerte, ya implementado

`CatalogoExplorer.jsx` **no** es donde el alumno ve un ejercicio: su modal es el
editor del admin ("Crear ejercicio nuevo" / "Editar ejercicio",
`CatalogoExplorer.jsx:1398`). El alumno lo ve en **`ItemCard.jsx`**.

**SQL real contra Supabase (2026-08-04)** sobre `catalogo_ejercicios`:

| Métrica | Valor |
| --- | --- |
| Ejercicios totales | 1343 |
| Con instrucciones vacías | 0 |
| **Sin un solo salto de línea** | **1343 de 1343** |
| Largo promedio / máximo | **493** / 990 caracteres |
| Que mencionan error/evitar/cuidado | **6 de 1343** |

Un párrafo gris de ~493 caracteres, leído **de pie, en medio de la serie** — el
mismo escenario que en §8 justificó el piso táctil de 44px. NN/g midió que
**79% escanea y sólo 16% lee palabra por palabra**, y el eye-tracking muestra
que **los numerales detienen la mirada** dentro de una masa de texto.

Fuentes: [NN/g — Concise, SCANNABLE, and Objective](https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/) · [NN/g — Be Succinct!](https://www.nngroup.com/articles/be-succinct-writing-for-the-web/) · [UXmatters — Scannability](https://www.uxmatters.com/mt/archives/2015/06/scannability-principle-and-practice.php) · [U. of Utah — Chunking](https://websites.it.utah.edu/announcements/posts/2025/july/chunking.php)

**Lo que abarató el arreglo:** el texto **ya venía escrito como pasos**
("Ajusta… Siéntate… Sujeta… Empuja…"). No hizo falta migrar nada: se parte por
oración al renderizar.

**El método de verificación es la parte importante.** Antes de tocar la UI se
corrió el mismo algoritmo del split **en SQL contra las 1343 fichas**:

- **1335 (99.4%)** dan entre 2 y 12 pasos → reciben el formato numerado.
- **8** dan una sola oración → caen al párrafo de siempre.
- **0** superan 12 → la guarda superior nunca se dispara, o sea que no hay
  ningún texto que el split rompa.
- Promedio 5.6 pasos, máximo 11.

Esto es lo que convierte "parece que anda" en "está medido sobre el 100% del
catálogo", y es el patrón a repetir: **validar la transformación contra todos
los datos reales antes de cambiar la pantalla**, no después.

### 9.4 · Landing — el veredicto se invierte

La primera versión descartó el mega menú "Funcionalidades" y los callouts
flotantes **porque DI no tenía landing**. Lucas confirmó el 2026-08-04 que
**el próximo paso es hacer una landing propia** con servicios, información y
marca de DI. El diagnóstico cambia, así que el veredicto también:

- **Mega menú**: pasa de descartado a **aplicable**. Criterio medido para
  cuando se construya: **3-4 columnas** es el punto dulce (más produce *choice
  overload*), techo de ~28-36 links, y **cada columna con encabezado de grupo**
  — Baymard midió **23% más abandono** en mega menús sin títulos de grupo.
  Fuentes: [NN/g — Mega Menus](https://www.nngroup.com/articles/mega-menus-work-well/) · [NN/g — Menu-Design Checklist](https://www.nngroup.com/articles/menu-design/)
- **Callouts sobre mockups**: pasa de descartado a **aplicable en la landing**.
  Criterio: **máximo 3 por imagen**, un solo color de acento, anotar sólo lo
  que no es obvio, tipografía y color de la marca propia.
  Fuente: [Screenhance — SaaS landing screenshots](https://screenhance.com/blog/saas-landing-page-screenshots)
- **Las 4 cards de feature** de Afitz son un buen molde estructural: cada una
  es *un beneficio concreto + una frase de por qué*, no una lista de features.

**Condición previa:** el manual de marca de DI está en producción con Claude
Diseño. Hasta que esté, la landing no arranca — el §7 sigue rigiendo: no se
copia estética, y el naranja de Afitz no entra. Lo que se copia es la
**estructura**, y el color sale del manual de marca propio.

### 9.5 · Hallazgos nuevos de DI (verificados esta ronda)

- **`plan_ejercicios.series` y `.reps` existen pero están 100% vacías** — 0 de
  84 filas. El esquema anticipó series×reps y **ninguna UI las escribe ni las
  lee**. Por eso los chips `3x8-10` / `90s` de Afitz **no son implementables
  hoy**: primero hay que construir el alta en el armador de planes. Y de
  descanso no hay ni columna.
- **`equipment_es` y `nivel` viven en `catalogo_ejercicios` pero nunca llegan
  al alumno**: el plan copia sólo `{nombre, desc, video, codigo, gif, unidad}`.
  La fila `Equipamentos | Dificuldade` de Afitz es dato que DI ya tiene y no
  muestra. Gap real y barato, pero requiere pasarlo por el modelo del plan.
- **Corrección al §8**: el `#070707` ya estaba resuelto — `theme.js:99` dice
  `#0d0d0d`. El manual estaba desactualizado respecto del código.
- **El gap visual no eran los tokens, era su aplicación**: `ItemCard.jsx`
  importaba `TS` y aun así escribía `fontSize` a mano en 6 lugares, usaba los
  caracteres `▲`/`▼` donde el resto de la app usa `lucide`, y metía un
  rectángulo `#fff` a sangre dentro de una card oscura. Los tres corregidos.

### 9.6 · Qué se implementó en esta ronda

1. **`ItemCard`: "Cómo ejecutar" con pasos numerados** y línea conectora, con
   `pasosDe()` — corta por punto seguido de mayúscula usando **sólo lookahead**
   (sin lookbehind, que Safari viejo no soporta), así los decimales (`2.5 kg`) y
   las abreviaturas seguidas de minúscula (`aprox. el ancho`) quedan intactos.
   Fuera del rango 2-12 cae al párrafo. Validado en SQL sobre las 1343 fichas y
   probado contra decimales, abreviaturas, grados, vacío y `null`.
2. **La media pasa arriba de los pasos** — primero se ve el movimiento, después
   se lee.
3. **`ItemCard` sin un solo `fontSize` numérico** (todos a tokens `TS`),
   chevron `lucide` en vez de `▲`/`▼`, y la caja del gif sigue blanca (los gifs
   del dataset traen fondo blanco) pero **enmarcada**, para que lea como visor
   deliberado y no como un rectángulo que sangra.
4. **`ScanCorporal` declara el costo antes de empezar** — `2 fotos` ·
   `~1 minuto` · `No se guardan las fotos`, como chips escaneables. El dato ya
   existía pero enterrado en prosa a 11px, por debajo del piso de 15px.

### 9.7 · Pendiente, y por qué

- **"Errores Comunes"**: bloqueado por **contenido**, no por UI — sólo 6 de 1343
  fichas lo tienen. Es un proyecto de redacción (o IA + revisión humana, igual
  que la reclasificación del §8).
- **Tabs de variante de ejecución**: bloqueado por la **reclasificación por
  movimiento** del §8. Los tabs son la interfaz de una taxonomía que DI no
  tiene; primero la taxonomía.
- **Chips de series/descanso**: bloqueado por las columnas muertas (§9.5).
- **Equipamiento/dificultad en la ficha**: disponible, requiere pasar 2 campos
  por el modelo del plan. Candidato claro para la próxima ronda.
- **Sesión guiada / nudge con cooldown**: decisiones de producto, no de UI.
- **Todo lo de Afitz que no esté en las 5 capturas**: sigue sin verificar.

---

*Fuentes completas citadas en cada sección — investigación real del 2026-08-03 (§1-§8) y del 2026-08-04 (§9), no una guía genérica de blog.*
