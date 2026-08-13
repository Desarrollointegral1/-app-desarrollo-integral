import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { S, TS, TAP, card, stepperTrack, stepperBtn, stepperDivider, stepperValue } from "../utils/theme.js";
import { pesoTotal, resumenCarga, detalleVacio, QUE_ANOTA } from "../utils/carga.js";
import { barraPredeterminada } from "../utils/equipamiento.js";

// ============================================================
// EL ALUMNO ANOTA LO QUE VE — 2026-08-13
// ============================================================
// Pedido de Lucas: "que cuando haga pecho plano sepa que tiene que poner el
// peso que uso de cada lado mas la barra el peso que tenga, por ejemplo
// 5 + 20 + 5 igual a 30 kilos".
//
// Este componente es el que hace posible esa frase. El alumno toca la barra
// que agarró y los discos que puso de UN lado; la cuenta la hace pesoTotal()
// (src/utils/carga.js) y el número que queda guardado es el total real.
//
// ── LOS BOTONES SON UN ATAJO, NUNCA UNA RESTRICCIÓN ───────────────────
// Corrección de Lucas del mismo día: "no puede basarse en lo que tengo porque
// trabajamos en distintos gimnasios". No existe "el equipamiento de la sala":
// los alumnos entrenan en lugares distintos, con barras y discos distintos.
// Una lista cerrada de botones le mentiría a la mitad de la gente — el alumno
// que agarró una barra de 15 que no está en la lista terminaría registrando
// una que no usó.
//
// Por eso, en TODA forma de carga, el número se puede escribir a mano sin
// entrar a configurar nada: la barra tiene su propio +/- (arranca en 20 y de
// ahí sube o baja), los discos tienen "otro disco", y las mancuernas su
// casillero. Los chips son el camino rápido para el caso de siempre; el
// casillero es el que hace que el sistema no se rompa fuera de un gimnasio.
//
// POR QUÉ ARRANCA CERRADO: un día tiene seis ejercicios. Si cada tarjeta
// mostrara el selector desplegado, la pantalla del día se volvería una lista
// de formularios y se perdería lo que el alumno mira primero, que es cuánto
// levantó. Cerrado muestra el total y el resumen ("Barra 20 + 5 por lado"),
// que es exactamente lo que necesita para saber qué cargar hoy.

const chip = (activo) => ({
  minHeight: TAP,
  minWidth: 52,
  padding: "6px 12px",
  borderRadius: 10,
  border: "1px solid " + (activo ? S.white : S.border2),
  background: activo ? S.white : S.card2,
  color: activo ? S.bg : S.white,
  fontSize: TS.chip,
  fontWeight: activo ? 900 : 600,
  cursor: "pointer",
  lineHeight: 1.15,
  fontVariantNumeric: "tabular-nums",
});

const filaChips = { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 };

const rotulo = {
  color: S.gray,
  fontSize: TS.chip,
  fontWeight: 800,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  marginBottom: 6,
};

// Los números se muestran con coma decimal: en la sala nadie dice "one point
// two five", dice "uno veinticinco".
const coma = (n) => String(Math.round(Number(n) * 100) / 100).replace(".", ",");

// El renglón chico del chip de barra: el chip ya muestra los kilos arriba, así
// que abajo va lo que DISTINGUE una barra de otra. Se corta por palabra y no a
// la mitad — "Barra olímpica romana a rulemanes" quedaba como "olímpica roman",
// que no se lee. El nombre completo sigue estando en el title y el aria-label.
const etiquetaCorta = (nombre) => {
  const sinBarra = String(nombre || "").replace(/^Barra\s+(de\s+)?/i, "").trim();
  // "Barra de 20" no necesita renglón: los kilos ya están arriba y repetirlos
  // debajo es ruido. Solo lo llevan las que tienen nombre propio.
  if (!sinBarra || /^\d/.test(sinBarra)) return "";
  const palabras = sinBarra.split(/\s+/).filter((p) => p.length > 1);
  return palabras.slice(0, 2).join(" ");
};

export default function SelectorCarga({
  forma,
  nombre = "",
  equipo = "",          // equipment_es del catálogo: distingue mancuerna de kettlebell
  equipamiento,          // lo que hay en la sala (ya normalizado)
  detalle,               // el detalle de la vuelta activa, o null si no hay
  total = 0,             // el número guardado hoy para esta vuelta
  sufijo = "kg",
  onChange,              // (detalleNuevo) => void — el padre calcula el total y persiste
  abiertoInicial = false,
}) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const barraDefault = barraPredeterminada(equipamiento);
  // Si no hay detalle todavía (casillero vacío o registro viejo sin detalle),
  // se trabaja sobre uno en blanco. El registro viejo NO se pisa hasta que el
  // alumno toca algo: hasta entonces se sigue mostrando su número.
  const elegido = !!(detalle && typeof detalle === "object" && detalle.forma === forma);
  const d = elegido ? detalle : detalleVacio(forma, { barraKg: barraDefault.peso, nombre });

  const totalCalculado = pesoTotal(d);
  // Lo que se muestra con el selector CERRADO. Si el alumno todavía no eligió
  // nada, manda el número que había guardado (0 en un casillero vacío, o el
  // registro viejo sin detalle) y NO el de la barra que viene preseleccionada:
  // mostrar "20 kg · Barra 20 sola" en un casillero en blanco es decirle que
  // ya cargó algo cuando no cargó nada.
  const mostrado = elegido ? totalCalculado : Number(total) || 0;
  const resumen = elegido ? resumenCarga(d) : "";

  const emitir = (nuevo) => onChange && onChange(nuevo);

  const barras = (equipamiento && equipamiento.barras) || [];
  const discos = (equipamiento && equipamiento.discos) || [];
  // Un kettlebell no es una mancuerna: las series de peso son distintas y
  // mezclarlas obliga al alumno a buscar su número entre el doble de chips.
  const esKettle = equipo === "Kettlebell";
  const unitarios = esKettle
    ? (equipamiento && equipamiento.kettlebells) || []
    : (equipamiento && equipamiento.mancuernas) || [];

  const ponerDisco = (v) => emitir({ ...d, discos: [...(d.discos || []), v] });
  const sacarDisco = (i) => emitir({ ...d, discos: (d.discos || []).filter((_, x) => x !== i) });

  // ── ESCRIBIR EL NÚMERO A MANO ────────────────────────────────────────
  // El gimnasio donde entrena el alumno puede tener una barra de 15 o un disco
  // de 7,5 que no están en la lista. Estos casilleros existen para eso: sin
  // ellos, la lista dejaría de ser un atajo y pasaría a ser un límite.
  const num = (v) => {
    const n = Number(String(v).replace(",", "."));
    return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
  };
  const [otroDisco, setOtroDisco] = useState("");
  const sumarOtroDisco = () => {
    const v = num(otroDisco);
    if (!v) return;
    ponerDisco(v);
    setOtroDisco("");
  };
  // Stepper reutilizable: el mismo control de +/- con casillero que ya usa la
  // tarjeta para el peso, para no inventar un segundo aspecto de lo mismo.
  const Stepper = ({ valor, onValor, etiqueta, paso = 1 }) => (
    <div style={stepperTrack()}>
      <button onClick={() => onValor(Math.max(0, Math.round((valor - paso) * 100) / 100))} aria-label={`Bajar ${etiqueta}`} style={stepperBtn()}>−</button>
      <div style={stepperDivider()} />
      <input
        type="number"
        inputMode="decimal"
        value={valor || ""}
        placeholder="0"
        aria-label={etiqueta}
        onChange={(e) => onValor(Math.max(0, Number(e.target.value) || 0))}
        style={{ ...stepperValue(), minWidth: 44, height: TAP }}
      />
      <div style={stepperDivider()} />
      <button onClick={() => onValor(Math.round((valor + paso) * 100) / 100)} aria-label={`Subir ${etiqueta}`} style={stepperBtn()}>+</button>
    </div>
  );

  return (
    <div style={{ marginTop: 8 }}>
      {/* ── CERRADO: el total y de qué está hecho ───────────────────── */}
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        data-selector-carga
        style={{
          width: "100%",
          minHeight: TAP,
          background: S.card2,
          border: "1px solid " + (abierto ? S.white : S.border2),
          borderRadius: 10,
          padding: "8px 12px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          textAlign: "left",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: S.white, fontSize: TS.lead, fontWeight: 900, lineHeight: 1.1 }}>
            {mostrado ? `${coma(mostrado)} ${sufijo}` : "Cargá el peso"}
          </div>
          <div style={{ color: S.lgray, fontSize: TS.chip, lineHeight: 1.3, marginTop: 2, whiteSpace: "normal" }}>
            {resumen || QUE_ANOTA[forma]}
          </div>
        </div>
        <ChevronDown
          size={18}
          color={S.gray}
          strokeWidth={2}
          style={{ flexShrink: 0, transform: abierto ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        />
      </button>

      {/* ── ABIERTO: se elige tocando, nunca escribiendo ─────────────── */}
      {abierto && (
        <div style={{ ...card, padding: 12, marginTop: 8 }}>
          {forma === "barra" && (
            <>
              <div style={rotulo}>Qué barra agarraste</div>
              <div style={filaChips}>
                {barras.map((b) => {
                  // Se compara por ID, no por peso: la sala tiene DOS barras de
                  // 20 (la común y la romana a rulemanes) y comparando por
                  // kilos las dos quedaban marcadas como elegidas a la vez.
                  const activa = elegido && (d.barra_id ? d.barra_id === b.id : d.barra === b.peso);
                  return (
                    <button
                      key={b.id}
                      onClick={() => emitir({ ...d, barra: b.peso, barra_id: b.id })}
                      aria-pressed={activa}
                      aria-label={`${b.nombre}, ${coma(b.peso)} kilos`}
                      title={b.nombre}
                      style={chip(activa)}
                    >
                      <span style={{ display: "block", fontWeight: 900 }}>{coma(b.peso)} kg</span>
                      {etiquetaCorta(b.nombre) && (
                        <span style={{ display: "block", fontSize: 10, opacity: 0.75, fontWeight: 600 }}>
                          {etiquetaCorta(b.nombre)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* El peso de la barra SIEMPRE se puede escribir, esté o no en
                  la lista de arriba: el alumno puede estar entrenando en otro
                  gimnasio, con otra barra. Arranca en 20 kg y de ahí sube o
                  baja, que es como lo pidió Lucas. */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                <div style={{ color: S.lgray, fontSize: TS.chip, flex: "1 1 110px", minWidth: 0, lineHeight: 1.3 }}>
                  ¿Otra barra? Poné sus kilos
                </div>
                <Stepper
                  valor={Number(d.barra) || 0}
                  onValor={(v) => emitir({ ...d, barra: v, barra_id: null })}
                  etiqueta="kilos de la barra"
                />
              </div>

              <div style={rotulo}>Discos de UN lado — tocá para sumar</div>
              <div style={filaChips}>
                {discos.map((v) => (
                  <button key={v} onClick={() => ponerDisco(v)} style={chip(false)}>
                    + {coma(v)}
                  </button>
                ))}
              </div>

              {/* Y un disco que no esté en la lista. Mismo motivo. */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                <input
                  type="number"
                  inputMode="decimal"
                  value={otroDisco}
                  placeholder="Otro disco"
                  aria-label="Kilos de un disco que no está en la lista"
                  onChange={(e) => setOtroDisco(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sumarOtroDisco(); }}
                  style={{ flex: "1 1 110px", minWidth: 0, minHeight: TAP, background: S.card2, border: "1px solid " + S.border2, borderRadius: 10, color: S.white, fontSize: TS.chip, padding: "0 12px", outline: "none", boxSizing: "border-box" }}
                />
                <button onClick={sumarOtroDisco} style={{ ...chip(false), fontWeight: 800 }}>
                  ＋ Sumar
                </button>
              </div>

              {(d.discos || []).length > 0 && (
                <div style={{ ...filaChips, alignItems: "center" }}>
                  <span style={{ color: S.gray, fontSize: TS.chip, fontWeight: 700, alignSelf: "center" }}>
                    Puestos:
                  </span>
                  {(d.discos || []).map((v, i) => (
                    <button
                      key={i}
                      onClick={() => sacarDisco(i)}
                      aria-label={`Sacar el disco de ${coma(v)}`}
                      style={{ ...chip(true), display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      {coma(v)}
                      <X size={13} strokeWidth={3} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {forma === "mancuernas" && (
            <>
              <div style={rotulo}>¿Cuántas agarraste?</div>
              <div style={filaChips}>
                {[
                  [1, esKettle ? "Una kettlebell" : "Una mancuerna"],
                  [2, esKettle ? "Dos kettlebells" : "Dos mancuernas"],
                ].map(([n, l]) => (
                  <button
                    key={n}
                    onClick={() => emitir({ ...d, cantidad: n })}
                    aria-pressed={Number(d.cantidad) === n}
                    style={{ ...chip(Number(d.cantidad) === n), flex: "1 1 120px" }}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <div style={rotulo}>{esKettle ? "Peso de UNA kettlebell" : "Peso de UNA mancuerna"}</div>
              <div style={filaChips}>
                {unitarios.map((v) => (
                  <button
                    key={v}
                    onClick={() => emitir({ ...d, unitario: v })}
                    aria-pressed={Number(d.unitario) === v}
                    style={chip(Number(d.unitario) === v)}
                  >
                    {coma(v)}
                  </button>
                ))}
              </div>

              {/* Y el que no esté en la lista: en otro gimnasio las mancuernas
                  pueden ir de 2 en 2 hasta 50, o tener medios kilos. */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <div style={{ color: S.lgray, fontSize: TS.chip, flex: "1 1 110px", minWidth: 0, lineHeight: 1.3 }}>
                  ¿No está en la lista? Escribilo
                </div>
                <Stepper
                  valor={Number(d.unitario) || 0}
                  onValor={(v) => emitir({ ...d, unitario: v })}
                  etiqueta={esKettle ? "kilos de la kettlebell" : "kilos de la mancuerna"}
                />
              </div>
            </>
          )}

          {/* El total, grande, con la cuenta escrita al lado. Es lo que
              contesta la pregunta original de Lucas: "5 + 20 + 5 = 30". */}
          <div
            style={{
              background: S.card2,
              border: "1px solid " + S.border2,
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ color: S.lgray, fontSize: TS.chip, flex: "1 1 120px", minWidth: 0 }}>
              {resumen || "Todavía no elegiste nada"}
            </div>
            <div style={{ color: S.white, fontWeight: 900, fontSize: TS.lead, whiteSpace: "nowrap" }}>
              {coma(totalCalculado)} {sufijo}
            </div>
          </div>

          <button
            onClick={() => setAbierto(false)}
            style={{
              width: "100%",
              marginTop: 10,
              minHeight: TAP,
              background: S.white,
              color: S.bg,
              border: "none",
              borderRadius: 10,
              fontSize: TS.ui,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Listo
          </button>
        </div>
      )}
    </div>
  );
}
