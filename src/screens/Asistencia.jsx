import { useState } from "react";
import { Check, X } from "lucide-react";
import { hoy, mesActual } from "../utils/helpers.js";
import { S, card, inp } from "../utils/theme.js";

// ── ASISTENCIA ────────────────────────────────────────────────────────
function Asistencia({ asistencia, onMarcar }) {
  const hoyStr = hoy();
  // Los registros pueden ser "YYYY-MM-DD" (viejos) o "YYYY-MM-DD HH:mm"
  // (nuevos, con hora) — comparar siempre solo la parte de fecha.
  const tieneDia = (d) => asistencia.some((x) => x.slice(0, 10) === d);
  const yaMarco = tieneDia(hoyStr);
  const [diaAnterior, setDiaAnterior] = useState("");
  const [showDiaAnterior, setShowDiaAnterior] = useState(false);
  const marcarDiaAnterior = () => {
    if (!diaAnterior || diaAnterior >= hoyStr) return;
    if (tieneDia(diaAnterior)) {
      alert("Ya marcaste ese día.");
      return;
    }
    onMarcar(diaAnterior);
    setDiaAnterior("");
    setShowDiaAnterior(false);
  };
  const mes = new Date();
  const diasMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const primerDia = new Date(mes.getFullYear(), mes.getMonth(), 1).getDay();
  const diasEnMes = Array.from({ length: diasMes }, (_, i) => {
    const d = new Date(mes.getFullYear(), mes.getMonth(), i + 1);
    return d.toISOString().split("T")[0];
  });
  const fueDias = asistencia.filter((d) => d.startsWith(mesActual().slice(0, 7))).length;
  const totalDias = diasEnMes.filter((d) => new Date(d) <= new Date()).length;
  const pct = totalDias > 0 ? Math.round((fueDias / totalDias) * 100) : 0;
  // Racha
  let racha = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60; i++) {
    const ds = checkDate.toISOString().split("T")[0];
    if (tieneDia(ds)) {
      racha++;
    } else if (i > 0) break;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  const DIAS = ["D", "L", "M", "M", "J", "V", "S"];
  return (
    <div>
      {" "}
      {/* Stats */}{" "}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {" "}
        <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
          {" "}
          <div style={{ color: S.green, fontWeight: 900, fontSize: 28 }}>{racha}</div>{" "}
          <div style={{ color: S.gray, fontSize: 14, letterSpacing: 1, marginTop: 2 }}>RACHA DIAS</div>{" "}
        </div>{" "}
        <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 900, fontSize: 28 }}>{fueDias}</div>{" "}
          <div style={{ color: S.gray, fontSize: 14, letterSpacing: 1, marginTop: 2 }}>ESTE MES</div>{" "}
        </div>{" "}
        <div style={{ flex: 1, ...card, padding: "12px 10px", textAlign: "center" }}>
          {" "}
          <div style={{ color: S.white, fontWeight: 900, fontSize: 28 }}>{pct}%</div>{" "}
          <div style={{ color: S.gray, fontSize: 14, letterSpacing: 1, marginTop: 2 }}>ASISTENCIA</div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Boton marcar */}{" "}
      <button
        onClick={() => !yaMarco && onMarcar(hoyStr)}
        className={yaMarco ? "di-pulse" : ""}
        style={{
          width: "100%",
          background: yaMarco ? "#0d1f0d" : S.white,
          color: yaMarco ? S.green : S.bg,
          border: yaMarco ? "1px solid " + S.green : "none",
          borderRadius: 10,
          padding: "14px",
          fontSize: 14,
          fontWeight: 900,
          cursor: yaMarco ? "default" : "pointer",
          marginBottom: 16,
          letterSpacing: 1,
          transition: "all 0.3s",
        }}
      >
        {" "}
        {yaMarco ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={14} />ASISTENCIA MARCADA HOY</span> : "MARCAR ASISTENCIA HOY"}{" "}
      </button>{" "}
      {/* Marcar día anterior */}{" "}
      {!showDiaAnterior ? (
        <button
          onClick={() => setShowDiaAnterior(true)}
          style={{
            width: "100%",
            background: "transparent",
            color: S.gray,
            border: "1px solid " + S.border,
            borderRadius: 8,
            padding: "10px",
            fontSize: 12,
            cursor: "pointer",
            marginBottom: 16,
          }}
        >
          {" "}
          + Marcar un día anterior{" "}
        </button>
      ) : (
        <div style={{ ...card, padding: 12, marginBottom: 16 }}>
          {" "}
          <div style={{ fontSize: 12, color: S.gray, marginBottom: 8 }}>¿Qué día faltaste de registrar?</div>{" "}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {" "}
            <input
              type="date"
              value={diaAnterior}
              max={hoyStr}
              onChange={(e) => setDiaAnterior(e.target.value)}
              style={{ ...inp, flex: 1 }}
            />{" "}
            <button
              onClick={marcarDiaAnterior}
              disabled={!diaAnterior || diaAnterior >= hoyStr}
              style={{
                background: S.white,
                color: S.bg,
                border: "none",
                borderRadius: 6,
                padding: "9px 14px",
                fontWeight: 900,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Marcar
            </button>{" "}
            <button
              onClick={() => {
                setShowDiaAnterior(false);
                setDiaAnterior("");
              }}
              style={{
                background: "transparent",
                color: S.gray,
                border: "1px solid " + S.border,
                borderRadius: 6,
                padding: "9px 10px",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* Calendario del mes */}{" "}
      <div style={{ ...card, padding: 14 }}>
        {" "}
        <div style={{ color: S.white, fontWeight: 700, marginBottom: 10, fontSize: 13 }}>
          {" "}
          {new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" }).toUpperCase()}{" "}
        </div>{" "}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
          {" "}
          {DIAS.map((d, i) => (
            <div key={i} style={{ textAlign: "center", color: S.lgray, fontSize: 14, fontWeight: 700 }}>
              {d}
            </div>
          ))}{" "}
        </div>{" "}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {" "}
          {Array(primerDia === 0 ? 6 : primerDia - 1)
            .fill(null)
            .map((_, i) => (
              <div key={"e" + i} />
            ))}{" "}
          {diasEnMes.map((d, i) => {
            const fue = tieneDia(d);
            const esHoy = d === hoyStr;
            const esFuturo = new Date(d) > new Date();
            return (
              <div
                key={d}
                style={{
                  aspectRatio: "1",
                  borderRadius: 6,
                  background: fue ? S.green : esHoy ? "#2a2a2a" : S.card2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: fue || esHoy ? 700 : 400,
                  color: fue ? "#000" : esHoy ? S.white : esFuturo ? S.lgray : S.gray,
                  border: esHoy ? "1px solid #444" : "none",
                }}
              >
                {" "}
                {i + 1}{" "}
              </div>
            );
          })}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
