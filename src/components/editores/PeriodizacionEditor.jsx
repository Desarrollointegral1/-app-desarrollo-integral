import { useState } from "react";
import { Pencil } from "lucide-react";
import { aplicarSemanaPeriodizacion } from "../../utils/helpers.js";
import { S, card, inp, smallBtn } from "../../utils/theme.js";

// ── PERIODIZACION EDITOR ──────────────────────────────────────────────

export function PeriodizacionEditor({ data, onChange }) {
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({ series: "", reps: "", intensidad: "", fecha: "" });
  const startEdit = (i) => {
    setEditIdx(i);
    setForm({
      series: String(data[i].series),
      reps: String(data[i].reps),
      intensidad: data[i].intensidad || "",
      fecha: data[i].fecha || "",
    });
  };
  // 2026-08-10: un solo onChange con el resultado final. Antes eran dos
  // (el cambio y después el recálculo de fechas sobre el array viejo), y el
  // segundo revertía al primero — ver aplicarSemanaPeriodizacion en helpers.js.
  const save = () => {
    if (!form.series || !form.reps) return;
    onChange(aplicarSemanaPeriodizacion(data, editIdx, form));
    setEditIdx(null);
  };
  // Fecha de inicio del plan: con elegirla una vez, todas las semanas se
  // autocompletan (cada semana arranca 7 días después de la anterior).
  const setFechaInicio = (yyyy_mm_dd) => {
    if (!yyyy_mm_dd) return;
    const [, m, d] = yyyy_mm_dd.split("-");
    const base = new Date(Number(yyyy_mm_dd.slice(0, 4)), Number(m) - 1, Number(d));
    const arr = data.map((r, i) => {
      const f = new Date(base.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      // El año se guarda aparte (2026-08-09): `fecha` es "12/8" sin año, así
      // que un plan empezado en diciembre y abierto en enero se leía como del
      // año nuevo. Guardarlo también deja reconstruir la fecha exacta.
      return { ...r, fecha: f.getDate() + "/" + (f.getMonth() + 1), anio: f.getFullYear() };
    });
    onChange(arr);
  };
  // Valor del campo de arriba. Pedido de Lucas (2026-08-09): "la fecha una vez
  // puesta debe figurar arriba y uno la puede modificar". El input era NO
  // CONTROLADO (sin `value`), así que al recargar la pantalla aparecía vacío
  // aunque las semanas ya tuvieran fecha: no había forma de ver con qué fecha
  // arrancaba el plan ni de corregirla sabiendo cuál era.
  const fechaInicioISO = (() => {
    const primera = data && data[0];
    if (!primera || !primera.fecha) return "";
    const [d, m] = String(primera.fecha).split("/").map(Number);
    if (!d || !m) return "";
    const anio = primera.anio || new Date().getFullYear();
    return `${anio}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  })();
  return (
    <div>
      {" "}
      <div style={{ ...card, padding: "12px 14px", marginBottom: 12 }}>
        <div style={{ fontSize: 14, color: S.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          Fecha de inicio (día 1 de la semana 1)
        </div>
        <input type="date" value={fechaInicioISO} onChange={(e) => setFechaInicio(e.target.value)} style={inp} />
        <div style={{ fontSize: 14, color: fechaInicioISO ? S.gray : S.green, marginTop: 6 }}>
          {fechaInicioISO
            ? "Podés cambiarla cuando quieras: al elegir otra fecha se recalculan las " + data.length + " semanas."
            : "Elegila una vez y todas las semanas toman su fecha automáticamente (una por semana)."}
        </div>
      </div>{" "}
      {data.map((r, i) => (
        <div key={i} style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
          {" "}
          {editIdx === i ? (
            <div>
              {" "}
              <div style={{ color: S.white, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
                Semana {r.semana}
              </div>{" "}
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {" "}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: S.gray, marginBottom: 4 }}>FECHA (lunes)</div>
                  <input
                    value={form.fecha}
                    onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                    placeholder="dd/mm"
                    style={inp}
                  />
                  {form.fecha && (
                    <div style={{ fontSize: 14, color: S.green, marginTop: 4 }}>
                      Semanas siguientes se calculan automaticamente
                    </div>
                  )}
                </div>{" "}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: S.gray, marginBottom: 4 }}>INTENSIDAD</div>
                  <input
                    value={form.intensidad}
                    onChange={(e) => setForm((f) => ({ ...f, intensidad: e.target.value }))}
                    placeholder="75%"
                    style={inp}
                  />
                </div>{" "}
              </div>{" "}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {" "}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: S.gray, marginBottom: 4 }}>SERIES</div>
                  {/* Auditoría 2026-07-30: series y reps son enteros. Sin
                      `inputMode` el celular abría el teclado alfabético y
                      había que cambiarlo a mano en cada campo. */}
                  <input
                    type="number"
                    inputMode="numeric"
                    autoComplete="off"
                    value={form.series}
                    onChange={(e) => setForm((f) => ({ ...f, series: e.target.value }))}
                    style={inp}
                  />
                </div>{" "}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: S.gray, marginBottom: 4 }}>REPS</div>
                  <input
                    type="number"
                    inputMode="numeric"
                    autoComplete="off"
                    value={form.reps}
                    onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))}
                    style={inp}
                  />
                </div>{" "}
              </div>{" "}
              <div style={{ display: "flex", gap: 8 }}>
                {" "}
                <button
                  onClick={save}
                  style={{
                    flex: 1,
                    background: S.white,
                    color: S.bg,
                    border: "none",
                    borderRadius: 6,
                    padding: "10px",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  GUARDAR
                </button>{" "}
                <button
                  onClick={() => setEditIdx(null)}
                  style={{
                    background: "transparent",
                    color: S.gray,
                    border: "1px solid " + S.border,
                    borderRadius: 6,
                    padding: "10px 16px",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>{" "}
              </div>{" "}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {" "}
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {" "}
                <div
                  style={{
                    minWidth: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: S.card2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: S.white,
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {r.semana}
                </div>{" "}
                <div>
                  {" "}
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 14 }}>
                    {r.series}x{r.reps}{" "}
                    {r.intensidad && <span style={{ color: S.gray, fontSize: 12 }}>· {r.intensidad}</span>}
                  </div>{" "}
                  <div style={{ color: S.gray, fontSize: 15, marginTop: 3 }}>
                    {r.fecha || <span style={{ color: S.lgray, fontStyle: "italic" }}>sin fecha</span>}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <button onClick={() => startEdit(i)} style={smallBtn(S.white)}>
                <Pencil size={14} />
              </button>{" "}
            </div>
          )}{" "}
        </div>
      ))}{" "}
    </div>
  );
}
