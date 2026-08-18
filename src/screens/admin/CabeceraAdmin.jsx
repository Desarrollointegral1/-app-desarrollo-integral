import { BarChart3, BookOpen, Calendar, Dumbbell, Moon, Settings, Stethoscope, Sun } from "lucide-react";
import { AlumnoBuscador } from "../../components/AlumnoBuscador.jsx";
import { IconDock } from "../../components/IconDock.jsx";
import { ICON_CROP } from "../../utils/iconos.js";
import { card, eyebrow, FONT_BODY, FONT_DISPLAY, S, segChip, segTrack, TAP } from "../../utils/theme.js";

// Sección "cabecera" del AdminPanel. Solo JSX: todo el estado y los
// handlers viven en AdminPanel.jsx y llegan por props (refactor 2026-08-17).
export function CabeceraAdmin({
  al,
  alumnos,
  darkMode,
  onClose,
  onModoEntrenador,
  onToggleTheme,
  sec,
  selId,
  setForm,
  setSec,
  setSelId,
  setShowCatalogo,
}) {
  return (
    <>
      {/* Header en 2 filas (2026-07-21, pedido de Lucas sobre un screenshot
          de mobile: antes título + botones compartían un renglón con
          justify-content:space-between y "Panel Admin"/"Desarrollo Integral"
          apilados verticalmente — en 375px el título se partía en 2 líneas
          y los botones se apretaban/desbordaban contra él).
          Fila 1: logo + título, todo en una sola línea horizontal.
          Fila 2 (renglón propio): los botones de acción (4 desde la
          ronda 16, punto 4 — se sacó "🖥 Armador" del header). */}
      {/* Ronda 17 (punto 2): "DESARROLLO INTEGRAL" pasa a ser la pieza
          protagonista del header (antes era "Panel Admin" el texto grande y
          el wordmark quedaba chico, gris, sin la fuente de marca) — mismo
          criterio tipográfico que el login/header del alumno: FONT_DISPLAY
          para el wordmark, ícono más grande (24→32). "Panel Admin" pasa a
          ser el eyebrow chico arriba. */}
      {/* Ronda 18: logo al DOBLE (32→64, y encima ICON_CROP sin aire
          interno — visualmente mucho más grande), clickeable → Dashboard
          (pantalla inicial del admin). "DESARROLLO INTEGRAL" centrado en
          el medio real del header (el logo va absolute a la izquierda, el
          texto se centra sobre el ancho total). */}
      <div style={{ padding: "14px 16px 0", marginBottom: 14, borderBottom: "1px solid " + S.border, paddingBottom: 14 }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 62, marginBottom: 12 }}>
          <img
            src={ICON_CROP}
            width={62}
            alt="DI"
            title="Ir al Dashboard"
            onClick={() => { setSec("dashboard"); setForm(null); }}
            style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", height: "auto", cursor: "pointer" }}
          />
          <div style={{ textAlign: "center", minWidth: 0, padding: "0 68px" }}>
            <div style={{ ...eyebrow, fontSize: 14 }}>Panel Admin</div>
            <div style={{ color: S.white, fontWeight: 800, fontSize: "clamp(16px, 5vw, 22px)", letterSpacing: 0.8, textTransform: "uppercase", fontFamily: FONT_DISPLAY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.15 }}>
              Desarrollo Integral
            </div>
          </div>
        </div>
        {/* 2026-08-13 (auditoría de uso): los 4 controles de esta fila —los que
            el profe tiene siempre a mano durante la clase— medían 153x35,
            38x36, 38x37 y 56x32: ninguno llegaba al piso táctil de 44px. Ahora
            los cuatro declaran TAP. `flexWrap` para que, con el zoom del
            sistema al 200%, la fila baje de renglón en vez de empujar "Cerrar"
            fuera de la pantalla. */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {/* Modo entrenador (ronda 9) — al lado del toggle de tema */}
          <button
            onClick={onModoEntrenador}
            title="Modo entrenador: operar la app como un alumno"
            style={{
              flex: "1 1 140px",
              minWidth: 0,
              minHeight: TAP,
              background: S.card3,
              color: S.white,
              border: "1px solid " + S.border2,
              borderRadius: 8,
              padding: "8px 6px",
              fontSize: "clamp(11px, 3vw, 13px)",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Dumbbell size={15} />Modo Entrenador</span>
          </button>
          {/* Ronda 16 (punto 4): el botón "🖥 Armador" (pantalla aparte) se
              sacó — esa función ahora vive DENTRO de "📚 Biblioteca de
              ejercicios" (botón "+ Crear plan de entrenamiento"). */}
          <button
            onClick={onToggleTheme}
            title={darkMode ? "Modo claro" : "Modo oscuro"}
            aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            style={{
              flexShrink: 0,
              minWidth: TAP,
              minHeight: TAP,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              color: S.gray,
              border: "1px solid " + S.border2,
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 13,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            {darkMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            onClick={() => { setSec("config"); setForm(null); }}
            title="Configuración"
            style={{
              flexShrink: 0,
              minWidth: TAP,
              minHeight: TAP,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: sec === "config" ? S.white : "transparent",
              color: sec === "config" ? S.bg : S.gray,
              border: "1px solid " + (sec === "config" ? S.white : S.border2),
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Settings size={16} />
          </button>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0,
              minWidth: TAP,
              minHeight: TAP,
              background: "transparent",
              color: S.gray,
              border: "1px solid " + S.border2,
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>{" "}
      {/* Biblioteca de ejercicios — reubicada arriba de todo (2026-07-21,
          pedido de Lucas): antes vivía adentro del Dashboard, después de
          "Crear alumno" y bien abajo. Ahora es fija, visible sin importar
          el tab (Dashboard/Alumno), justo debajo de la fila de botones y
          arriba de los tabs.
          Ronda 16 (punto 2): esto es contexto Dashboard/Alumno, no
          Configuración — Lucas marcó que aparecía mezclado arriba de
          "Crear admin | Comunicados". Se excluye igual que los 3 tabs de
          abajo. */}
      {/* Ronda 17 (punto 2): el header, la navegación (Biblioteca +
          Dashboard/Alumno) y el buscador quedaban visualmente pegados, como
          un solo bloque confuso — cada uno pasa a ser un "módulo" separado
          con su propia card (fondo + borde), no solo texto suelto sobre el
          fondo de la pantalla. El header ya tiene su borderBottom (arriba). */}
      {/* Ronda 18 — MÓDULO DE NAVEGACIÓN: card nivel 1 con eyebrow, el
          switch Dashboard/Alumno como segmented control (labels 13px
          legibles) y la Biblioteca como botón propio nivel 3. Se distingue
          a simple vista del header (arriba, sin card) y del buscador
          (abajo, otra card con su propio eyebrow). */}
      {sec !== "config" && (
      <div style={{ ...card, margin: "0 16px 14px", padding: 12 }}>
        <div style={{ ...eyebrow, marginBottom: 8 }}>Navegación</div>
        <div style={segTrack()}>
          <button onClick={() => { setSec("dashboard"); setForm(null); }} style={{ ...segChip(sec === "dashboard"), fontSize: 13, padding: "10px 4px" }}>
            Dashboard
          </button>
          <button onClick={() => { setSec("alumnos"); setForm(null); }} style={{ ...segChip(sec !== "dashboard"), fontSize: 13, padding: "10px 4px" }}>
            Alumno
          </button>
        </div>
        <button
          onClick={() => setShowCatalogo(true)}
          style={{ width: "100%", marginTop: 8, background: S.card3, color: S.white, border: "1px solid " + S.border2, borderRadius: 10, padding: "12px 14px", fontWeight: 800, fontSize: 13, letterSpacing: 0.8, textTransform: "uppercase", cursor: "pointer", fontFamily: FONT_BODY }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}><BookOpen size={15} />Biblioteca de ejercicios</span>
        </button>
      </div>
      )}{" "}
      {/* 2) Selector de alumno — SOLO en el Dashboard (2026-07-21): adentro
          de la ficha el buscador y la fila con el nombre quedaban duplicados;
          para cambiar de alumno se vuelve al Dashboard. Módulo propio
          (ronda 17, punto 2) separado del bloque de navegación de arriba. */}
      {sec === "dashboard" && (
        <div style={{ ...card, margin: "0 16px 14px", padding: 12 }}>
          <div style={{ ...eyebrow, marginBottom: 8 }}>Buscar alumno</div>
          <AlumnoBuscador alumnos={alumnos} selId={selId} onSelect={(id) => { setSelId(id); setForm(null); }} />
        </div>
      )}{" "}
      {/* 3) ...y los submenús cuelgan del alumno elegido — ronda 9: TRES
          grupos grandes (Ejercicios · Planificación · Reportes). Ronda 12:
          NO se muestran en el Dashboard (sin alumno elegido todavía) — recién
          aparecen al entrar a la sección "Alumno" (o cualquier otra distinta
          de Dashboard, ej. tras tocar un alumno desde la lista). */}
      {/* Bug M (2026-07-21): estos 3 tabs son del contexto "alumno seleccionado"
          (Ejercicios/Planificación/Reportes) — antes aparecían también en
          Configuración porque la condición solo excluía "dashboard". */}
      {sec !== "dashboard" && sec !== "config" && (
      <div style={{ padding: "0 16px" }}>
        {/* 2026-08-12 — "Planificación" pasó a llamarse "Planes": adentro
            viven DOS cosas distintas que Lucas pidió separar (la Planificación
            propiamente dicha —la progresión— y el Plan de ejercicios), y que
            el grupo se llamara igual que una de sus dos partes era justamente
            lo que las hacía confundir.
            Además, al alumno "solo video" no se le muestra: no entrena, así
            que no tiene ni progresión ni ejercicios que asignarle. */}
        <IconDock
          items={[
            ["plan", "Ejercicios", Dumbbell],
            ["planes", "Planes", Calendar],
            ["reportes", "Reportes", BarChart3],
            ["evaluacion", "Evaluación", Stethoscope],
          ].filter(([k]) => !(al?.tipo === "video" && k === "planes"))}
          activo={sec}
          onSelect={(k) => { setSec(k); setForm(null); }}
        />
      </div>
      )}
    </>
  );
}
