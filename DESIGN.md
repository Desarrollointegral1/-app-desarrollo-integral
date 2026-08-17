# DESIGN.md — Desarrollo Integral (app de gestión)

> Contrato visual. Lo leen los agentes antes de tocar la interfaz.
> **La fuente de verdad no es este archivo: es `src/utils/theme.js`.** Acá está el resumen
> y las reglas; los valores viven ahí y ahí se cambian. Verificado el 2026-08-17.

## Qué es

La app de gestión de alumnos, **en uso y con datos reales**. Producción:
https://desarrollointegral.app · desarrollo: `localhost:5173`
(nunca usar `app-desarrollo-integral.vercel.app`).

Esto no es un prototipo. Cada cambio se prueba con la app corriendo antes de commitear.

## Dirección de arte

Dark premium, minimal. Referencias: Equinox, Skulpt.
**Grises, blanco y negro como base. El rojo es el ÚNICO acento** (Brand Kit v1.0, 2026-07-30).
El verde queda reservado a confirmación de estado real —guardado, presente— nunca decorativo
y nunca en texto de marca.

## El sistema, que ya existe y se respeta

`src/utils/theme.js` define tres cosas y toda la app las obedece:

**1 · Niveles de superficie.** Al subir de nivel el fondo **siempre aclara** (en dark) o se
diferencia con borde y sombra (en claro). Así los módulos se distinguen sin depender del color.

| Nivel | Qué es | Token |
|---|---|---|
| 0 | fondo base, el lienzo | `S.bg` |
| 1 | módulo (header, listado, buscador) — radio 14 | `S.card` + estilo `card` |
| 2 | elemento dentro de un módulo — radio 10 | `S.card2` + `innerCard` |
| 3 | control interactivo en reposo — radio 8 | `S.card3` |

**2 · Tipografía, con roles estrictos.**

| Constante | Familia | Para qué |
|---|---|---|
| `FONT_DISPLAY` | PP Formula Condensed | **solo** títulos de pantalla, marca, wordmark |
| `FONT_BODY` | PP Formula | toda la interfaz: labels, botones, inputs, menús |
| `FONT_BRAND` | PP Formula | piezas de marca puntuales |
| `FONT_UI` | sans del sistema | escape hatch. Solo donde PP Formula no rinde (tablas muy densas). **Nunca como base.** |

**3 · Escala `TS`, con piso duro.** `chip/label` 15 · `ui/body` 16 · `lead` 20 · `title` 26 ·
`hero` 34. **Usar siempre el token, nunca un número suelto.**

**4 · `TAP = 44px`** de piso táctil (iOS HIG / WCAG 2.5.5). Todo helper interactivo lo declara.

## Las dos lecciones que ya se pagaron caras

1. **No bajar de 15px.** La ronda 18 cambió `FONT_BODY` a la sans del sistema porque "PP
   Formula no se entiende en cuerpos chicos". Medido en producción, la causa era otra: el
   texto estaba a 10–13px (71 de 99 elementos de la vista del alumno por debajo de 16px;
   199 elementos a 11px en la biblioteca). **No era la fuente, era el tamaño.**
   Si algo no entra, se sacan elementos o se acorta el texto — no se achica la letra.
2. **Los botones eran intocables.** Se midieron 11 de 13 botones de la vista del alumno y
   84 de 93 de la biblioteca por debajo de 44px.

## Reglas duras

1. **Rojo = único acento.** Verde solo para estado real confirmado.
2. **Nada de `#hex` ni de números sueltos en código nuevo:** van `S.*`, `TS.*`, `TAP`, `FONT_*`.
3. **375px es el ancho de diseño**, no un caso borde: la usan desde el celular.
4. **Cada cambio se ve andando** antes del commit. Hay datos de alumnos reales adentro.

## Deuda medida (2026-08-17, con `wc -l`)

| Archivo | Líneas |
|---|---|
| `App.jsx` (en la **raíz**, no en `src/`) | **8825** |
| `services/supabase.js` | 2845 |
| `src/components/CatalogoExplorer.jsx` | 2097 |

> El método importa: estos números salen de `wc -l`. Medir con `Get-Content \| Measure-Object -Line`
> de PowerShell da entre 1 y 300 líneas menos según el archivo, y esa diferencia ya hizo que una
> primera versión de esta tabla subestimara los cuatro valores.
>
> `App_old.jsx` (4420 líneas) se sacó del disco el 17/08: no lo importaba ningún archivo de código
> y git había dejado de seguirlo en `75104e0`. Si hace falta: `git show 75104e0~1:App_old.jsx`.

`App.jsx` es el archivo que hay que partir, y es cirugía: 856 bloques `style={{…}}`
apoyados en los tokens de `theme.js`. **No se parte de una sentada ni sin la app corriendo
delante.** El orden razonable es sacar primero lo que no es interfaz (llamadas a Supabase a
`services/`, estado reusable a `hooks/`) y recién después separar pantallas.

## Qué NO hacer

- No crear una segunda fuente de tokens. Si falta un valor, se agrega a `theme.js`.
- No tocar `web/` desde acá: **la web está pausada por decisión de Lucas desde el 29/07** y
  es otro proyecto (Next.js), aunque cuelgue de la misma carpeta.
- No crear carpetas que no vayan a tener al menos tres archivos adentro.
