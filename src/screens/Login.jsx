import { useEffect, useRef, useState } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { loginAdmin, loginConCodigo } from "../../services/supabase.js";
import DIWordmark from "../components/DIWordmark.jsx";
import { GlobalStyles } from "../components/GlobalStyles.jsx";
import { Logo3D } from "../components/Logo3D.jsx";
import { FONT_BRAND, S, TAP, TS, inp } from "../utils/theme.js";

// ── LOGIN ─────────────────────────────────────────────────────────────
// 2026-07-30, pedido de Lucas: que el login se parezca a Mercado Libre o
// Instagram — usuario recordado + ingreso con huella. Dos mecanismos
// SEPARADOS, cada uno cubriendo lo que el otro no puede:
//   1) Usuario recordado: SIEMPRE (todos los navegadores), un simple
//      localStorage con el último código usado. No es un dato sensible.
//   2) Clave + huella: se delega al gestor de contraseñas del SISTEMA vía la
//      Credential Management API (`navigator.credentials`), NO a un
//      localStorage propio. Es la diferencia entre "de verdad seguro" y
//      "parece seguro": el navegador/SO ya guarda la clave en su bóveda
//      protegida por huella/Face ID (así la ve iOS Keychain o el Administrador
//      de contraseñas de Android/Chrome) — nosotros solo la pedimos prestada
//      un instante para completar el formulario. Nunca la tocamos en texto
//      plano fuera de esa llamada. En iOS Safari (que no implementa esta
//      API) el mismo resultado sale gratis: el teclado ya ofrece autocompletar
//      con Face ID/Touch ID porque los campos ya tienen autoComplete correcto.
const LS_ULTIMO_USUARIO = "di_ultimo_usuario";
const credencialesOk = typeof window !== "undefined" && "credentials" in navigator && typeof window.PasswordCredential === "function";

// WhatsApp de soporte para el bloque "¿No podés entrar?". Vacío = no se
// muestra el link, solo el texto. Lucas: poné acá tu número en formato
// internacional sin signos (ej. "5491122334455") y el botón aparece solo.
const WHATSAPP_SOPORTE = "";

// 2026-08-13 (auditoría de uso): la pantalla mostraba `e.message` crudo. Sin
// internet, un alumno de 75 años leía literalmente «Failed to fetch» — inglés
// y jerga de programador. Y los mensajes del servidor hablaban de «username»,
// «Codigo» y «PIN» mientras la pantalla dice Usuario y Clave. Acá se traduce
// TODO a las mismas palabras que están en pantalla, con tildes.
// Se traduce en el cliente a propósito: cubre también lo que devuelve la
// versión ya desplegada de la Edge Function, sin depender de un redeploy.
function mensajeLogin(e, esAdmin) {
  const crudo = (e && e.message) || "";
  const sinRed = typeof navigator !== "undefined" && navigator.onLine === false;
  if (sinRed || e instanceof TypeError || /fetch|network|failed to fetch/i.test(crudo)) {
    return "No hay internet. Conectate al wifi o a los datos y tocá Ingresar otra vez.";
  }
  if (/demasiados intentos/i.test(crudo)) {
    return "Probaste muchas veces seguidas. Esperá un rato y volvé a intentar.";
  }
  if (/inv[aá]lid|incorrect|no encontrad/i.test(crudo)) {
    // El error más confuso de todos: si el alumno pisó sin querer el botón de
    // administrador, su clave correcta falla siempre y nada se lo explica.
    if (esAdmin) return "Estás con el acceso de administrador prendido. Si sos alumno, apagalo con el botón de abajo y probá de nuevo.";
    return "El usuario o la clave no son correctos. Fijate en el papel que te dio Lucas y probá de nuevo.";
  }
  return "No pudimos entrar. Probá de nuevo en un momento.";
}

export function Login({ onLogin, onAdmin, darkMode, onToggleTheme }) {
  const [codigo, setCodigo] = useState(() => {
    try { return localStorage.getItem(LS_ULTIMO_USUARIO) || ""; } catch { return ""; }
  });
  const [pin, setPin] = useState("");
  const [esAdmin, setEsAdmin] = useState(false);
  const [err, setErr] = useState("");
  const [cargando, setCargando] = useState(false);
  // Evita pedir la credencial dos veces en desarrollo (React StrictMode monta
  // los efectos dos veces) y evita ofrecerla de nuevo si el usuario ya la
  // rechazó una vez en esta visita.
  const yaPidioCredencial = useRef(false);

  const go = async (codigoOverride, pinOverride) => {
    const cod = (codigoOverride ?? codigo).trim();
    const clave = (pinOverride ?? pin).trim();
    if (!cod || !clave) {
      setErr("Te falta escribir el usuario y la clave.");
      return;
    }

    setCargando(true);
    setErr("");

    try {
      if (esAdmin) {
        const admin = await loginAdmin(cod, clave);
        try { localStorage.setItem(LS_ULTIMO_USUARIO, cod); } catch {}
        onAdmin(admin);
      } else {
        const alumno = await loginConCodigo(cod, clave);
        try { localStorage.setItem(LS_ULTIMO_USUARIO, cod); } catch {}
        // Ofrece guardar la clave en el gestor de contraseñas del sistema —
        // la próxima vez el navegador la completa sola (con huella/Face ID
        // si el dispositivo lo pide). Nunca se guarda en nuestro propio
        // storage: se lo entregamos al navegador y listo.
        if (credencialesOk) {
          try {
            await navigator.credentials.store(new window.PasswordCredential({ id: cod, password: clave, name: cod }));
          } catch {
            // El usuario puede cancelar el guardado, o el navegador no
            // soportar algo puntual — no es un error de login, se ignora.
          }
        }
        onLogin(alumno);
      }
    } catch (e) {
      setErr(mensajeLogin(e, esAdmin));
    } finally {
      setCargando(false);
    }
  };

  // Al entrar a la pantalla, si el navegador tiene una clave guardada para
  // esta app, se la pedimos (dispara el prompt de huella/Face ID del SO si
  // corresponde) y completamos el login solos. `mediation: "optional"`
  // muestra el selector nativo de cuentas en vez de loguear en silencio —
  // el usuario siempre ve y confirma qué cuenta está entrando.
  useEffect(() => {
    if (!credencialesOk || yaPidioCredencial.current) return;
    yaPidioCredencial.current = true;
    navigator.credentials
      .get({ password: true, mediation: "optional" })
      .then((cred) => {
        if (cred && cred.type === "password" && cred.id && cred.password) {
          setCodigo(cred.id);
          setPin(cred.password);
          go(cred.id, cred.password);
        }
      })
      .catch(() => {}); // cancelado por el usuario o sin credencial guardada
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: S.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        // Ronda 11: el logo sube un poco (antes todo el bloque quedaba
        // centrado exacto en el viewport) — arranca más arriba con padding
        // fijo en vez de centrado vertical puro.
        // Ronda 16 (punto 1): Lucas marcó que quedaba mucho aire muerto
        // arriba del logo — bajado de 8vh a un tope chico con clamp para
        // que no vuelva a crecer en pantallas altas.
        // Ronda 17 (punto 1): Lucas insistió — todavía quedaba mucho aire
        // arriba del logo. Bajado al mínimo real (casi pegado al borde).
        justifyContent: "flex-start",
        paddingTop: "clamp(16px, 4vh, 40px)",
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: 24,
        fontFamily: "inherit",
        position: "relative",
      }}
    >
      <GlobalStyles />
      {/* Toggle modo claro/oscuro — discreto, arriba a la derecha */}
      <button
        onClick={onToggleTheme}
        title={darkMode ? "Modo claro" : "Modo oscuro"}
        aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          background: "transparent",
          color: S.gray,
          border: "1px solid " + S.border,
          borderRadius: 8,
          width: TAP,
          height: TAP,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          fontSize: TS.ui,
          cursor: "pointer",
        }}
      >
        {darkMode ? <Moon size={18} /> : <Sun size={18} />}
      </button>
      {/* Header de marca — ronda 11: ícono y wordmark al DOBLE de tamaño que
          la ronda anterior (600 / 480, con tope responsivo para no desbordar
          celulares angostos — ver Logo3D y el width:"min(...)" de acá abajo).
          Subtítulo del login: "APP DE ENTRENAMIENTO" en vez de "CENTRO DE
          ENTRENAMIENTO" — el SVG trae ese texto quemado como paths, así que
          se recorta el wordmark a SOLO "DESARROLLO INTEGRAL"
          (soloDesarrollo) y el subtítulo se arma como texto HTML aparte,
          con PP Formula (ya cargada globalmente en index.html) en bold
          condensado imitando el tracking de marca. */}
      {/* Ronda 18: el aire arriba del logo y entre logo y wordmark NO era
          del layout — era el ~30% de padding interno del SVG original.
          Logo3D ahora usa ICON_CROP (recortado al dibujo real), así que el
          dibujo arranca de verdad donde arranca el contenedor: logo casi
          tocando el borde superior y wordmark pegado al logo. */}
      {/* 2026-07-31, pedido de Lucas: "el logo un poco más chico quedaría
          mejor" — 260→200 (y el wordmark acompaña la proporción, 480→380),
          menos protagonismo del ícono para que el formulario de login entre
          más rápido en la vista sin scrollear. */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 380, marginBottom: "clamp(28px, 6vh, 56px)" }}>
        <Logo3D size={200} />
        <DIWordmark
          soloDesarrollo
          width={380}
          style={{ color: S.white, marginTop: 14, width: "min(380px, 100%)", maxWidth: "100%", height: "auto" }}
        />
        <div
          style={{
            color: S.gray,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: "uppercase",
            marginTop: 6,
            textAlign: "center",
            fontFamily: FONT_BRAND,
          }}
        >
          App de entrenamiento
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* 2026-08-13 (auditoría de uso): la pantalla del video ya estaba
            hecha para un adulto mayor (30/21/22px, botones de 72px) pero ESTE
            login, que es la puerta de entrada de todos, seguía a 13-16px con
            la escala pensada para los alumnos jóvenes. Ahora los campos miden
            60px de alto con letra de 20px y el botón de entrar 64px.
            Y vuelven las etiquetas de verdad arriba de cada campo: el
            placeholder gris era la única pista de qué iba en cada uno, se
            borraba al empezar a escribir y encima quedaba en 3.7:1 de
            contraste. La etiqueta no se va nunca y dice el dato que solo
            estaba en la cabeza de Lucas ("4 números"). */}
        <label htmlFor="login-usuario" style={{ display: "block", color: S.white, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          Tu usuario
        </label>
        <input
          id="login-usuario"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Usuario"
          autoComplete="username"
          autoCapitalize="characters"
          style={{ ...inp, background: S.card2, border: "1px solid " + S.border, marginBottom: 16, minHeight: 60, fontSize: 20 }}
          disabled={cargando}
        />
        <label htmlFor="login-clave" style={{ display: "block", color: S.white, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          Tu clave (4 números)
        </label>
        <input
          id="login-clave"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.slice(0, 4))}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Clave"
          maxLength={4}
          // La clave son 4 dígitos: en el celular tiene que abrir el teclado
          // numérico, no el alfabético. Faltaba `inputMode`, así que el
          // alumno tenía que cambiar de teclado a mano en cada ingreso.
          // `pattern` es el truco que fuerza el teclado numérico en iOS, donde
          // inputMode sobre type=password no siempre alcanza.
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="current-password"
          style={{ ...inp, background: S.card2, border: "1px solid " + S.border, letterSpacing: 4, minHeight: 60, fontSize: 20 }}
          disabled={cargando}
        />

        {/* Auditoría UX 2026-08-03: el contenedor ya existía, pero con 8% de
            opacidad de fondo era prácticamente invisible contra un dark mode
            casi negro — se leía como "texto rojo suelto". Mismo layout,
            fondo/borde con más peso para que se note que es un estado, no
            solo una palabra roja. */}
        {err && (
          <div role="alert" style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#ff8080", fontSize: 18, lineHeight: 1.4, marginTop: 16, padding: "14px 16px", background: "rgba(229,62,62,0.16)", borderRadius: 8, border: "1px solid rgba(229,62,62,0.45)" }}>
            <span aria-hidden="true" style={{ fontSize: 18, flexShrink: 0 }}>⚠</span>
            {err}
          </div>
        )}

        <button
          // 2026-07-30: NO poner onClick={go} directo — React pasa el
          // SyntheticEvent del click como primer argumento, que pisaba el
          // nuevo parámetro `codigoOverride` de go() (usado por el autofill
          // de credenciales) con el objeto del evento en vez de undefined.
          // Bug real, encontrado en pruebas: "(codigoOverride ?? codigo).trim
          // is not a function". Con la arrow function, go() se llama sin
          // argumentos y usa el estado normal (codigo/pin del formulario).
          onClick={() => go()}
          disabled={cargando}
          style={{
            width: "100%",
            marginTop: 20,
            background: cargando ? S.card2 : S.white,
            color: cargando ? S.gray : S.bg,
            border: "none",
            borderRadius: 10,
            padding: "14px",
            minHeight: 64,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: "uppercase",
            cursor: cargando ? "not-allowed" : "pointer",
            opacity: cargando ? 0.7 : 1,
          }}
        >
          {cargando ? "Validando..." : "Ingresar"}
        </button>

        {/* 2026-08-13 (auditoría de uso): un alumno trabado acá no tenía a
            dónde ir — la pantalla entera tenía 5 elementos tocables y ninguno
            era una salida. Este bloque es la red de contención: se abre solo
            si lo tocan, así que no le agrega ruido al que entra de una. */}
        <details style={{ marginTop: 22 }}>
          <summary style={{ color: S.white, fontSize: 18, fontWeight: 700, cursor: "pointer", padding: "12px 0", minHeight: TAP, listStyle: "none", textDecoration: "underline" }}>
            ¿No podés entrar?
          </summary>
          <div style={{ color: S.gray, fontSize: 17, lineHeight: 1.5, marginTop: 6 }}>
            Fijate tres cosas en el papel que te dio Lucas: que el usuario esté escrito igual,
            que la clave sean los 4 números, y que el teléfono tenga internet.
            {WHATSAPP_SOPORTE ? (
              <a
                href={`https://wa.me/${WHATSAPP_SOPORTE}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 14, minHeight: 60, borderRadius: 10, border: "1px solid " + S.border2, color: S.white, fontSize: 19, fontWeight: 700, textDecoration: "none" }}
              >
                Escribirle a Lucas por WhatsApp
              </a>
            ) : (
              <div style={{ marginTop: 10 }}>Si sigue sin andar, escribile a Lucas por WhatsApp y te pasa el usuario y la clave de nuevo.</div>
            )}
          </div>
        </details>
      </div>

      {/* Acceso admin.
          2026-08-13 (auditoría de uso): este botón medía 288x47 y estaba a
          28px de INGRESAR. Un alumno que lo pisaba sin querer pasaba a fallar
          SIEMPRE, con su clave correcta, y la única señal era un puntito.
          Tres cambios: se va bien abajo (96px de aire, fuera del alcance del
          pulgar que apunta a Ingresar), deja de parecer un botón principal
          (texto chico, sin caja, en gris) y cuando está prendido el error de
          login lo dice con todas las letras (ver mensajeLogin). Sigue visible
          porque Lucas y Ari entran por acá todos los días. */}
      <button
        onClick={() => setEsAdmin((v) => !v)}
        disabled={cargando}
        style={{
          marginTop: 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          maxWidth: "100%",
          background: esAdmin ? S.card3 : "transparent",
          color: esAdmin ? S.white : S.lgray,
          border: "1px solid " + (esAdmin ? S.white : "transparent"),
          borderRadius: 22,
          padding: "12px 14px",
          minHeight: TAP,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          // Que el texto pueda cortarse: con el zoom del sistema al 200% este
          // botón era lo único que se salía de la pantalla del login (+22px).
          whiteSpace: "normal",
          textAlign: "center",
          cursor: cargando ? "not-allowed" : "pointer",
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: esAdmin ? S.white : S.lgray, flexShrink: 0 }} />
        {esAdmin ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={14} />Acceso administrador activado</span> : "Acceso administrador"}
      </button>
    </div>
  );
}
