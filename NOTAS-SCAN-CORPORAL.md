# Notas — Scan Corporal (Fase 1)

Implementación de la Fase 1 de "Scan Corporal": estimar composición corporal a partir de 2 fotos
(frontal + lateral) usando visión de Claude + la fórmula de la Marina de EE.UU. (determinística),
sin balanza ni bioimpedancia física.

## Qué se hizo

1. **Backend** — `api/scan-corporal.js`: función serverless de Vercel (Node, convención zero-config
   `/api`), NO forma parte del proyecto Next.js de `web/` (esa carpeta no se tocó).
   - Recibe `{ fotoFrontal, fotoLateral, peso, altura, genero, edad }` (fotos como data URL base64).
   - Llama a Claude (`claude-sonnet-4-6`, mismo modelo que ya usa `web/lib/llm/multi-llm-executor.ts`)
     pidiéndole que estime `cuello_cm`, `cintura_cm` y (si es mujer) `cadera_cm` a partir de las fotos,
     usando la altura conocida como referencia de escala. La IA **solo estima medidas**, nunca el %grasa.
   - Con esas medidas aplica la fórmula de la Marina de EE.UU. **en código**, determinística — no la
     calcula el modelo.
   - Deriva masa magra, masa grasa e IMC con el peso conocido.
   - Devuelve `{ porcentajeGrasa, masaMagraKg, masaGrasaKg, imc, medidasEstimadas }`.
   - **Privacidad**: las fotos viajan en el body del request, se usan una sola vez para la llamada a
     Claude y se descartan al terminar — el archivo no las escribe a disco ni las sube a ningún storage
     (ni Supabase ni otro). Solo el JSON resultado vuelve al cliente.

2. **Frontend** — `src/components/ScanCorporal.jsx` (`ScanCorporalForm`), enganchado dentro de
   `EstudioBioSeccion` (`src/components/EstudioBio.jsx`), junto al formulario existente de
   bioimpedancia y "Estudio anterior" (mismo patrón visual/tokens de `src/utils/theme.js`).
   - Pide peso/altura/género/edad (edad se autocompleta desde `alumno.fecha_nacimiento` si está
     cargada, igual que el formulario de bioimpedancia; si no, se puede tipear).
   - Sube 2 fotos con `<input type="file">` simple (sin guía visual animada — eso es Fase 2, fuera de
     alcance acá). Las fotos se redimensionan a 900px/JPEG en el navegador antes de mandarlas (mismo
     criterio que ya usa `services/supabase.js` para fotos de bioimpedancia), así el payload es liviano.
   - Llama a `/api/scan-corporal`, muestra el resultado (grasa, IMC, masas, medidas estimadas).
   - "Guardar en historial" llama a la misma `saveBioimpedanciaCompleta` que ya usa el resto de
     bioimpedancia, con `metadata.tipo = "scan_2fotos"` (mismo patrón que ya existía para
     `"estudio_anterior"`) para distinguirlo de una medición manual — **no se creó una tabla nueva ni
     se agregaron columnas**, todo va al jsonb `metadata` que la tabla `bioimpedancia` ya tenía.
     También se extendieron `saveBioimpedanciaCompleta`/`actualizarBioimpedancia` en
     `services/supabase.js` para aceptar opcionalmente `medidas_estimadas`, `masa_magra_kg` y
     `masa_grasa_kg` dentro de ese mismo `metadata` (mismo patrón `if (datos.x) metadata.x = ...` que
     ya usaban `conclusion`/`objetivo`/`requerimiento`/`tipo`).
   - **No se sube la foto al guardar** — a propósito, por la regla de privacidad: el registro guardado
     es solo el JSON de resultado.

3. `vercel.json`: se agregó `functions."api/scan-corporal.js".maxDuration: 60` porque una llamada de
   visión a Claude puede tardar más que el timeout default de una función serverless.

4. `package.json`: se agregó `@anthropic-ai/sdk` (misma versión que usa `web/package.json`) — no
   estaba en las dependencias de la raíz porque hasta ahora el proyecto raíz no llamaba a la IA
   directamente (esa lógica vivía solo en `web/`, ver más abajo).

## ⚠️ Lo que no pude confirmar — necesita atención de Lucas

- **`ANTHROPIC_API_KEY` en el proyecto de Vercel de la RAÍZ (no en `web/`).** El repo tiene DOS
  proyectos separados: la raíz (esta app, dominio propio) y `web/` (Next.js, desplegado aparte en
  `luquigivi.vercel.app`, ver el rewrite en `vercel.json`). El único lugar del repo donde ya se usa
  `ANTHROPIC_API_KEY` es dentro de `web/` (`web/lib/coach/coach.ts`, `web/app/api/coalition/route.ts`,
  etc.) — son variables de entorno de ESE proyecto de Vercel, que es un deploy distinto al de la raíz.
  No tengo forma de confirmar desde el código si el proyecto de Vercel de la raíz ya tiene
  `ANTHROPIC_API_KEY` configurada o no. **Antes de que esto funcione en producción, hay que agregar
  `ANTHROPIC_API_KEY` en el dashboard de Vercel del proyecto raíz** (Settings → Environment Variables),
  con una key de Anthropic (puede ser la misma que usa `web/`, es la misma cuenta de Anthropic, distinto
  proyecto de Vercel). Sin esa variable, `/api/scan-corporal` responde 500 con un mensaje claro
  (`"ANTHROPIC_API_KEY no configurada en el servidor."`), no falla en silencio.

- No había ningún patrón previo de función serverless para IA en la raíz del repo (solo existía
  `supabase/functions/auth-bridge`, que es una Edge Function de Supabase para login, sin relación con
  IA). Se optó por el directorio `api/` en la raíz porque es la convención zero-config de Vercel para
  proyectos Vite/estáticos — no requiere tocar `vercel.json` más que el `maxDuration`.

## Fuera de alcance (Fase 2, a propósito)

- Guía visual animada para sacar las fotos (silueta de referencia, etc.).
- Comparación evolutiva entre scans / gráfico de %grasa en el tiempo.
- Cualquier ajuste de precisión del prompt más allá de la primera versión funcional.
