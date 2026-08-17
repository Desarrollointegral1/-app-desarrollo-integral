import { useState } from "react";
import { Megaphone } from "lucide-react";
import { FONT_BODY, S, TAP, TS, card } from "../utils/theme.js";

// ── NOVEDADES DEL ALUMNO (contador de no leídos) ───────────────────────
// Auditoría 2026-07-30: los avisos del gimnasio se listaban siempre abiertos
// y sin ninguna señal de "hay algo nuevo". El alumno tenía que acordarse de
// cuál ya había leído, y en el celular los avisos viejos le empujaban el plan
// del día hacia abajo. Se aplica el patrón que ya conocen de Instagram y
// Facebook: un acceso plegado con un contador rojo de no leídos; se abre de
// un toque y ahí se marcan como leídos.
//
// Por qué localStorage y no Supabase: la tabla `novedades` es global (un
// aviso para todo el gimnasio, sin estado por alumno). "Leído" es una
// preferencia del dispositivo del alumno, no un dato del negocio — agregar
// una tabla novedades_leidas + sus políticas RLS sería mucho más caro que
// resolverlo en el cliente, y si se pierde el peor caso es ver el badge una
// vez de más.
export function NovedadesAlumno({ novedades, alumnoId }) {
  const key = "di_novedades_vistas_" + alumnoId;
  const [vistas, setVistas] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
  });
  const [abierto, setAbierto] = useState(false);

  if (novedades.length === 0) return null;

  // Criterio de "no leída": su id NO está en la lista guardada. Se guardan
  // ids y no una fecha de última lectura porque el admin puede despublicar y
  // volver a publicar un aviso (toggle `activo`) sin que cambie su `fecha`:
  // con fecha, ese aviso re-publicado quedaría marcado como leído para
  // siempre. Con ids cada aviso se cuenta una sola vez, sin falsos negativos.
  const noLeidas = novedades.filter((n) => !vistas.includes(n.id));

  const abrir = () => {
    setAbierto((a) => !a);
    if (noLeidas.length > 0) {
      const ids = novedades.map((n) => n.id);
      setVistas(ids);
      try { localStorage.setItem(key, JSON.stringify(ids)); } catch { /* modo privado: se muestra el badge de nuevo, no rompe nada */ }
    }
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={abrir}
        aria-expanded={abierto}
        aria-label={noLeidas.length > 0
          ? `Novedades: ${noLeidas.length} ${noLeidas.length === 1 ? "novedad sin leer" : "novedades sin leer"}`
          : "Novedades del gimnasio"}
        style={{
          ...card,
          width: "100%",
          minHeight: TAP,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          color: S.white,
          fontFamily: FONT_BODY,
          fontSize: TS.ui,
          fontWeight: 700,
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <Megaphone size={18} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>Novedades</span>
        {/* Badge: solo si hay algo sin leer. Nunca un cero — un contador en
            cero es ruido. Rojo (S.red) porque acá sí es una alerta real, que
            es el único uso permitido del acento por el Brand Kit v1.0. */}
        {noLeidas.length > 0 && (
          <span
            aria-hidden="true"
            style={{
              minWidth: 24,
              height: 24,
              borderRadius: 12,
              background: S.red,
              color: "#fff",
              fontSize: TS.chip,
              fontWeight: 800,
              lineHeight: "24px",
              textAlign: "center",
              padding: "0 7px",
              boxSizing: "border-box",
              flexShrink: 0,
            }}
          >
            {noLeidas.length > 9 ? "9+" : noLeidas.length}
          </span>
        )}
        <span style={{ color: S.gray, fontSize: TS.chip, flexShrink: 0 }}>{abierto ? "▲" : "▼"}</span>
      </button>
      {/* Cerrado se sigue viendo de qué se trata lo nuevo: el título del
          aviso más reciente sin leer queda como preview, igual que la
          notificación de un chat. Así nadie se pierde un aviso por no abrir. */}
      {!abierto && noLeidas.length > 0 && (
        <div style={{ color: S.gray, fontSize: TS.label, lineHeight: 1.4, padding: "6px 14px 0" }}>{noLeidas[0].titulo}</div>
      )}
      {abierto && novedades.map((n) => (
        <div key={n.id} style={{ ...card, padding: "12px 14px", marginTop: 8, borderLeft: "3px solid " + S.border2 }}>
          <div style={{ color: S.white, fontWeight: 700, fontSize: TS.ui, display: "flex", alignItems: "center", gap: 6 }}>{n.titulo}</div>
          {n.contenido && <div style={{ color: S.gray, fontSize: TS.body, lineHeight: 1.5, marginTop: 4 }}>{n.contenido}</div>}
        </div>
      ))}
    </div>
  );
}
