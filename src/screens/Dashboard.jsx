import { useState } from "react";
import { Archive, Check, RotateCcw, Trash2 } from "lucide-react";
import { cargarAlumnosArchivados, restaurarAlumno } from "../../services/supabase.js";
import { FotoAlumno } from "../components/FotoAlumno.jsx";
import { hoy, mesActual } from "../utils/helpers.js";
import { FONT_BODY, S, TS, card, checkboxBox, checkboxWrap, eyebrow } from "../utils/theme.js";

// ── DASHBOARD ADMIN ───────────────────────────────────────────────────
export function Dashboard({ alumnos, selId, onSelect, onDelete, onNuevo, onBiblioteca, onDeselect, onToggleAsistencia, showToast }) {
  const [soloSinEntrenar, setSoloSinEntrenar] = useState(false);
  // 2026-08-04: recuperar alumnos archivados (ver migración 030 — "eliminar"
  // ya no borra, archiva). Se carga bajo demanda, no en cada render del
  // Dashboard, porque en el uso normal nadie la abre.
  const [archivados, setArchivados] = useState(null); // null = no cargado todavía
  const [verArchivados, setVerArchivados] = useState(false);
  const [restaurando, setRestaurando] = useState(null);
  const abrirArchivados = () => {
    setVerArchivados((v) => !v);
    if (archivados === null) cargarAlumnosArchivados().then(setArchivados);
  };
  const restaurar = async (al) => {
    setRestaurando(al.id);
    const ok = await restaurarAlumno(al.id);
    setRestaurando(null);
    if (ok) {
      setArchivados((prev) => prev.filter((a) => a.id !== al.id));
      showToast && showToast(`${al.nombre} restaurado`);
    } else {
      showToast && showToast("No se pudo restaurar — revisá la consola");
    }
  };
  const lunesStr = (() => {
    const d = new Date();
    const l = new Date(d);
    l.setDate(d.getDate() - d.getDay() + 1);
    return l.toISOString().split("T")[0];
  })();

  // Acceso rápido real (auditoría UX 2026-08-03, patrón "círculos" tipo
  // Mercado Pago — pero solo donde resuelve algo, no de adorno): quién NO
  // entrenó hoy es la pregunta que un coach se hace al abrir la app a la
  // mañana. "Crear alumno" ya tiene su botón prominente abajo y no se toca
  // — no todo accesorio necesita volverse un círculo.
  const sinEntrenarHoy = alumnos.filter((al) => {
    const ultima = ([...(al.asistencia || [])].sort((a, b) => b.localeCompare(a))[0] || "").slice(0, 10);
    return ultima !== hoy();
  }).length;

  return (
    <div onClick={onDeselect}>
      {/* El buscador de alumno vive UNA sola vez en el layout del AdminPanel
          (arriba de los submenús) — acá adentro no se repite (ronda 4). */}
      <div style={{ display: "flex", gap: 14, marginBottom: 16 }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setSoloSinEntrenar((v) => !v)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            background: "transparent", border: "none", cursor: "pointer", flex: 1,
          }}
          aria-pressed={soloSinEntrenar}
        >
          <div
            style={{
              width: 52, height: 52, borderRadius: "50%",
              background: soloSinEntrenar ? S.white : S.card3,
              border: "1px solid " + (soloSinEntrenar ? S.white : S.border2),
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: soloSinEntrenar ? S.bg : S.white,
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            {sinEntrenarHoy}
          </div>
          <span style={{ fontSize: 10.5, color: soloSinEntrenar ? S.white : S.gray, fontWeight: soloSinEntrenar ? 800 : 500, textAlign: "center" }}>
            Sin entrenar hoy
          </span>
        </button>
        {/* 2026-08-04: acceso a los archivados — mismo patrón de círculo,
            para recuperar a alguien que se borró (a propósito o por error,
            ver migración 030). Sin contador precargado (no vale la pena una
            consulta extra en cada apertura del Dashboard solo para esto). */}
        <button
          onClick={abrirArchivados}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            background: "transparent", border: "none", cursor: "pointer", flex: 1,
          }}
          aria-pressed={verArchivados}
        >
          <div
            style={{
              width: 52, height: 52, borderRadius: "50%",
              background: verArchivados ? S.white : S.card3,
              border: "1px solid " + (verArchivados ? S.white : S.border2),
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            <Archive size={20} strokeWidth={2} color={verArchivados ? S.bg : S.white} />
          </div>
          <span style={{ fontSize: 10.5, color: verArchivados ? S.white : S.gray, fontWeight: verArchivados ? 800 : 500, textAlign: "center" }}>
            Archivados
          </span>
        </button>
      </div>

      {verArchivados && (
        <div style={{ ...card, padding: 12, marginBottom: 14 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ ...eyebrow, marginBottom: 8 }}>
            {archivados === null ? "Cargando…" : `Archivados (${archivados.length})`}
          </div>
          {archivados !== null && archivados.length === 0 && (
            <div style={{ color: S.gray, fontSize: 13 }}>Nadie archivado por ahora.</div>
          )}
          {(archivados || []).map((al) => (
            <div key={al.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid " + S.border }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: S.white, fontWeight: 700, fontSize: 14 }}>{al.nombre}</div>
                <div style={{ color: S.gray, fontSize: 12 }}>
                  {al.username || al.codigo}
                  {al.archivado_en ? ` · archivado el ${al.archivado_en.slice(8, 10)}/${al.archivado_en.slice(5, 7)}` : ""}
                </div>
              </div>
              <button
                onClick={() => restaurar(al)}
                disabled={restaurando === al.id}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: S.white, color: S.bg, border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 800, cursor: restaurando === al.id ? "default" : "pointer", flexShrink: 0, opacity: restaurando === al.id ? 0.6 : 1 }}
              >
                <RotateCcw size={14} strokeWidth={2} />{restaurando === al.id ? "Restaurando…" : "Restaurar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Crear alumno — abre pantalla aparte (modal), ronda 9. Queda como
          botón ancho (acción primaria de alta frecuencia): un círculo la
          demotaría, no la mejoraría. */}
      <button
        onClick={(e) => { e.stopPropagation(); onNuevo(); }}
        style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: "11px 14px", fontWeight: 900, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", marginBottom: 14 }}
      >
        Crear alumno
      </button>

      {/* Biblioteca de ejercicios: reubicada 2026-07-21 como botón fijo
          arriba de los tabs Dashboard/Alumno en AdminPanel (ver header) —
          ya no vive acá adentro, ver onBiblioteca solo queda como prop
          legacy sin uso directo en este componente. */}

      <div style={{ ...eyebrow, letterSpacing: 2, marginBottom: 10 }}>
        {soloSinEntrenar ? `Sin entrenar hoy (${sinEntrenarHoy})` : `Todos los alumnos (${alumnos.length})`}
      </div>

      {/* Ronda 18: el alumno seleccionado va PRIMERO en la lista (la card
          duplicada que aparecía abajo del buscador se eliminó).
          2026-07-30: en escritorio la lista pasa a grilla (ver .di-grid-cards
          en GlobalStyles). En celular sigue siendo una columna, igual que
          siempre — el breakpoint vive en CSS, no en JS, para que no dependa
          de un re-render. */}
      <div className="di-grid-cards">
      {[...alumnos]
        .filter((al) => {
          if (!soloSinEntrenar) return true;
          const ultima = ([...(al.asistencia || [])].sort((a, b) => b.localeCompare(a))[0] || "").slice(0, 10);
          return ultima !== hoy();
        })
        .sort((a, b) => (a.id === selId ? -1 : 0) - (b.id === selId ? -1 : 0)).map((al) => {
        const asistSemana = (al.asistencia || []).filter((d) => d >= lunesStr).length;
        const asistMes = (al.asistencia || []).filter((d) => d.startsWith(mesActual().slice(0, 7))).length;
        const ultimaAsist = ([...(al.asistencia || [])].sort((a, b) => b.localeCompare(a))[0] || "").slice(0, 10) || undefined;
        const entrenoHoy = ultimaAsist === hoy();
        const isSelected = al.id === selId;
        return (
          <div
            key={al.id}
            onClick={(e) => { e.stopPropagation(); onSelect(al.id); }}
            style={{ ...card, marginBottom: 10, padding: "14px 16px", border: "1px solid " + (isSelected ? S.white : S.border), cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div>
                <FotoAlumno foto={al.foto} size={44} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 15 }}>{al.nombre}</div>
                  {/* Toggle de asistencia de HOY, desde el mismo listado del
                      admin (auditoría 2026-07-22: antes había que ir a Modo
                      Entrenador). Un toque marca/desmarca. */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleAsistencia && onToggleAsistencia(al.id, !entrenoHoy); }}
                    title={entrenoHoy ? "Asistencia de hoy marcada. Tocá para deshacer" : "Marcar asistencia de hoy"}
                    aria-label="Marcar asistencia de hoy"
                    role="checkbox"
                    aria-checked={entrenoHoy}
                    // 2026-07-31, pedido de Lucas: "Marcar hoy" no le gustaba
                    // como pill de texto que cambiaba de palabra — un
                    // checkbox real (casilla + tilde) es el patrón que
                    // cualquiera reconoce al toque, y el texto no cambia de
                    // palabra según el estado, solo la casilla.
                    style={{ ...checkboxWrap(), background: "transparent", border: "none", fontFamily: FONT_BODY }}
                  >
                    <span style={checkboxBox(entrenoHoy)}>
                      {entrenoHoy && <Check size={14} strokeWidth={3} color={S.bg} />}
                    </span>
                    <span style={{ fontSize: TS.chip, color: entrenoHoy ? S.white : S.gray, fontWeight: 700 }}>Asistencia</span>
                  </button>
                </div>
                <div style={{ color: S.gray, fontSize: 15, marginTop: 3 }}>
                  {al.username || al.codigo}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: S.card2, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ color: S.white, fontWeight: 700 }}>{asistSemana}</div>
                <div style={{ color: S.gray, fontSize: 15 }}>ESTA SEM.</div>
              </div>
              <div style={{ flex: 1, background: S.card2, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ color: S.white, fontWeight: 700 }}>{asistMes}</div>
                <div style={{ color: S.gray, fontSize: 15 }}>ESTE MES</div>
              </div>
              <div style={{ flex: 1, background: S.card2, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                {/* La fecha se mostraba cruda en ISO ("2026-07-26"): al pasar
                    la lista a grilla de 3 columnas la caja se angosto y la
                    fecha se partia en dos lineas. dd/mm entra y ademas se
                    lee como la escribe una persona. */}
                <div style={{ color: S.white, fontWeight: 700, whiteSpace: "nowrap" }}>
                  {ultimaAsist ? `${ultimaAsist.slice(8, 10)}/${ultimaAsist.slice(5, 7)}` : "—"}
                </div>
                <div style={{ color: S.gray, fontSize: 15, whiteSpace: "nowrap" }}>ÚLTIMA VEZ</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(al.id, al.nombre); }}
                title={`Eliminar a ${al.nombre}`}
                aria-label={`Eliminar a ${al.nombre}`}
                // El rojo es el unico acento de la marca y "nunca un bloque":
                // habia un boton con borde rojo pleno por cada alumno, o sea
                // 7 marcas rojas compitiendo en la misma pantalla. Queda gris
                // en reposo y se pone rojo recien al apuntarlo.
                onMouseEnter={(e) => { e.currentTarget.style.color = S.red; e.currentTarget.style.borderColor = S.red; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = S.lgray; e.currentTarget.style.borderColor = S.border2; }}
                style={{ background: "transparent", color: S.lgray, border: "1px solid " + S.border2, borderRadius: 6, padding: "4px 10px", fontSize: 13, cursor: "pointer", flexShrink: 0, transition: "color 0.2s, border-color 0.2s" }}
              ><Trash2 size={16} /></button>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
