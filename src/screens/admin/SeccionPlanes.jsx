import { Pencil } from "lucide-react";
import { PeriodizacionEditor } from "../../components/editores/PeriodizacionEditor.jsx";
import { ORDEN_DIAS } from "../../utils/helpers.js";
import { esPeriodizacionDiaPropia, esPeriodizacionPropia, etiquetaPeriodizacion, NIVELES as NIVELES_PER, OBJETIVOS as OBJETIVOS_PER, periodizacionDelDia, refPeriodizacion, tienePeriodizacion } from "../../utils/periodizacion.js";
import { card, innerCard, S, segChip, segTrack, smallBtn } from "../../utils/theme.js";

// Sección "planes" del AdminPanel. Solo JSX: todo el estado y los
// handlers viven en AdminPanel.jsx y llegan por props (refactor 2026-08-17).
export function SeccionPlanes({
  agregandoDia,
  al,
  asignarPeriodizacion,
  guardarPeriodizacionAlumno,
  guardarPeriodizacionDelDia,
  hacerPeriodizacionPropiaDelDia,
  perDiaSel,
  perNombres,
  planesTab,
  sacarPeriodizacion,
  selectedDia,
  selectorDePlan,
  setAgregandoDia,
  setPerDiaSel,
  setPlanesTab,
  setSelectedDia,
  volverACompartirPeriodizacion,
  volverPeriodizacionGlobal,
}) {
  return (
    <>
      <div>
        {/* DOS COSAS DISTINTAS, ELEGIDAS APARTE (2026-08-12) — pedido de
            Lucas: "quiero dejar las planificaciones separadas de los
            planes de ejercicios". En la base ya estaban separadas
            (`periodizaciones` vs `plan_variantes`); lo que se confundía
            era la pantalla, porque las dos vivían bajo el mismo nombre
            ("Planificación") y la pestaña de ejercicios se llamaba "Plan x
            día", que no dice qué es. Ahora cada una se llama por lo que
            es, y el renglón de abajo lo dice en castellano llano: una es
            la progresión, la otra son los ejercicios. Ninguna de las dos
            es obligatoria — las dos tienen su "sin ninguno". */}
        <div style={{ ...segTrack(), marginBottom: 6 }}>
          {[
            ["Planificación", "periodizacion"],
            ["Plan de ejercicios", "plan-dias"],
          ].map(([l, k]) => (
            // El chip de nivel 3 corta con "…" (whiteSpace:nowrap): "PLAN
            // DE EJERCICIOS" se leía "PLAN DE EJERCI…" en 375px, que es
            // justo lo que hay que poder distinguir de "PLANIFICACIÓN".
            // Acá se deja envolver en dos renglones.
            <button
              key={k}
              onClick={() => setPlanesTab(k)}
              style={{ ...segChip(planesTab === k), whiteSpace: "normal", overflow: "visible", textOverflow: "clip", lineHeight: 1.2, padding: "8px 4px" }}
            >
              {l}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: S.lgray, marginBottom: 14, lineHeight: 1.5 }}>
          {planesTab === "periodizacion"
            ? "Planificación = la progresión: cuántas series, repeticiones e intensidad le tocan cada semana. No dice qué ejercicios hace."
            : "Plan de ejercicios = qué ejercicios hace cada día y en qué orden. No dice series ni repeticiones: eso lo pone la Planificación."}
        </div>
        {planesTab === "periodizacion" && al && (
          <div style={{ ...card, overflow: "hidden", padding: 14 }}>
            {/* Marca de herencia — la misma que movilidad y entrada en
                calor (2026-08-10): el que nunca la tocó hereda los cambios
                del predeterminado, el que tiene la suya no se pisa nunca. */}
            {(() => {
              const propia = esPeriodizacionPropia(al);
              const ref = refPeriodizacion(al);
              // 2026-08-12: sin semanas cargadas el alumno NO tiene
              // planificación, y eso es un estado válido — entrena los
              // ejercicios de su plan sin progresión prescrita.
              const conPlanificacion = tienePeriodizacion(al);
              return (
                <div style={{ ...innerCard, padding: "10px 12px", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: !conPlanificacion ? S.lgray : propia ? S.white : S.green, fontWeight: 700 }}>
                      {!conPlanificacion
                        ? "Sin planificación"
                        : propia
                          ? "Planificación propia de este alumno"
                          : ref
                            ? `Heredada del predeterminado · ${etiquetaPeriodizacion(perNombres, ref.objetivo, ref.nivel)}`
                            : "Sin predeterminado asignado"}
                    </span>
                    <span style={{ fontSize: 13, color: S.gray, flex: 1, minWidth: 160 }}>
                      {!conPlanificacion
                        ? "Este alumno entrena sin progresión prescrita. Elegí una de abajo cuando quieras darle una."
                        : propia
                          ? "Editar el predeterminado ya no le cambia nada."
                          : ref
                            ? "Si cambiás el predeterminado en Biblioteca, se le actualiza sola. Editar acá la vuelve propia."
                            : "Elegí objetivo y nivel para que siga un predeterminado. Las fechas cargadas se conservan."}
                    </span>
                    {propia && ref && (
                      <button onClick={volverPeriodizacionGlobal} style={smallBtn(S.gray)}>
                        Volver al predeterminado
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {/* "Sin planificación" — el equivalente exacto de "Sin
                        plan" del otro lado (pedido de Lucas 2026-08-12:
                        "los dos me tienen que dar la opción de dejar sin
                        ningún predeterminado"). Va PRIMERO, como en
                        SelectorPlanDia, y borra las semanas + la
                        referencia al predeterminado. */}
                    <button
                      onClick={sacarPeriodizacion}
                      style={{ ...smallBtn(!conPlanificacion ? S.white : S.gray), borderStyle: conPlanificacion ? "dashed" : "solid" }}
                    >
                      Sin planificación
                    </button>
                    {OBJETIVOS_PER.map((o) =>
                      NIVELES_PER.map((n) => {
                        const activo = !propia && ref && ref.objetivo === o.id && ref.nivel === n.id;
                        return (
                          <button
                            key={o.id + n.id}
                            onClick={() => asignarPeriodizacion(o.id, n.id)}
                            style={smallBtn(activo ? S.white : S.gray)}
                          >
                            {/* 2026-08-12: el nombre de la planificación sale
                                de la fila, no de las constantes — si Lucas la
                                renombró en la Biblioteca, acá se lee así. */}
                            {etiquetaPeriodizacion(perNombres, o.id, n.id)}
                          </button>
                        );
                      }),
                    )}
                  </div>
                </div>
              );
            })()}
            {/* ── QUÉ DÍAS COMPARTEN Y CUÁL TIENE LA SUYA (2026-08-10) ──
                Pedido de Lucas: "cada día tiene su progresión y puede
                tener una planificación distinta o no... un día puede
                estar haciendo fuerza el otro volumen". El caso normal es
                UNA sola compartida, así que el chip "Todos los días" va
                primero y separar un día es explícito. Sin esta lista, en
                tres meses no hay forma de entender por qué un día
                progresa distinto. */}
            {(() => {
              const planesReales = (al.planes || []).filter((p) => p && !p._sintetico);
              if (planesReales.length === 0) return null;
              const planSel = planesReales.find((p) => p.id === perDiaSel) || null;
              const propios = planesReales.filter(esPeriodizacionDiaPropia);
              return (
                <div style={{ ...innerCard, padding: "10px 12px", marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: S.gray, marginBottom: 8 }}>
                    {propios.length === 0
                      ? "Los días comparten esta misma progresión. Tocá un día para darle la suya."
                      : `${propios.length} día(s) con progresión propia — los demás comparten la del alumno.`}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => setPerDiaSel(null)} style={smallBtn(perDiaSel === null ? S.white : S.gray)}>
                      Todos los días
                    </button>
                    {planesReales.map((p) => {
                      const propia = esPeriodizacionDiaPropia(p);
                      return (
                        <button
                          key={p.id}
                          onClick={() => setPerDiaSel(p.id)}
                          title={propia ? "Este día tiene su propia progresión" : "Este día comparte la del alumno"}
                          style={{ ...smallBtn(perDiaSel === p.id ? S.white : propia ? S.green : S.gray) }}
                        >
                          {p.dia_semana}{propia ? " · propia" : ""}
                        </button>
                      );
                    })}
                  </div>
                  {planSel && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                      <span style={{ fontSize: 13, color: esPeriodizacionDiaPropia(planSel) ? S.white : S.green, fontWeight: 700 }}>
                        {esPeriodizacionDiaPropia(planSel)
                          ? `${planSel.dia_semana} tiene su propia progresión`
                          : `${planSel.dia_semana} comparte la del alumno`}
                      </span>
                      {esPeriodizacionDiaPropia(planSel) ? (
                        <button onClick={() => volverACompartirPeriodizacion(planSel)} style={smallBtn(S.gray)}>
                          Volver a compartir
                        </button>
                      ) : (
                        <button onClick={() => hacerPeriodizacionPropiaDelDia(planSel)} style={smallBtn(S.white)}>
                          Darle progresión propia
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
            {(() => {
              // El editor edita lo que esté seleccionado: la del alumno
              // (que baja a todos los días que comparten) o la de UN día.
              const planSel = (al.planes || []).find((p) => p && !p._sintetico && p.id === perDiaSel) || null;
              if (!planSel) return <PeriodizacionEditor data={al.plan.periodizacion} onChange={guardarPeriodizacionAlumno} />;
              if (!esPeriodizacionDiaPropia(planSel)) {
                // Editar acá sin haber separado el día editaría la del
                // alumno creyendo que se edita la del día — el error más
                // fácil de cometer y el más difícil de notar después.
                return (
                  <div style={{ ...card, padding: "16px 14px", textAlign: "center", color: S.gray, fontSize: 13 }}>
                    {planSel.dia_semana} usa la progresión del alumno. Para cambiarle solo a este día, primero dale progresión propia.
                  </div>
                );
              }
              return (
                <PeriodizacionEditor
                  data={periodizacionDelDia(planSel, al.plan.periodizacion)}
                  onChange={(semanas) => guardarPeriodizacionDelDia(planSel, semanas)}
                />
              );
            })()}
          </div>
        )}{" "}
        {planesTab === "plan-dias" && al && (() => {
          // Punto 8 (ronda 16): reorganizado — antes mostraba SIEMPRE los
          // 7 días fijos + "Fijo" sin importar si el alumno entrena ese
          // día. Ahora solo se ven los días que la persona entrena
          // (al.horarios) + cualquier día que YA tenga un plan asignado
          // (para que nada desaparezca), en el orden real de la semana,
          // etiquetados "Día 1/2/3..." si el alumno está en modo
          // numérico (mismo criterio que ya usa PlanesPrincipales) —
          // el ADMIN siempre ve el día real de la semana también, chico
          // al lado, así el mapeo real no se pierde para asistencia/
          // reportes. Al final, un tile "+ Agregar día" para sumar un
          // día nuevo (incluido "Fijo", que ya no ocupa un lugar fijo).
          const DIAS_SEMANA = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
          const diasHorario = (al.horarios || []).map((h) => h.dia).filter(Boolean);
          const diasConPlanReal = (al.planes || []).filter((p) => !p._sintetico && p.dia_semana !== "Fijo").map((p) => p.dia_semana);
          const diasUsados = [...new Set([...diasHorario, ...diasConPlanReal])]
            .filter((d) => DIAS_SEMANA.includes(d))
            .sort((a, b) => (ORDEN_DIAS[a] || 9) - (ORDEN_DIAS[b] || 9));
          const tieneFijo = (al.planes || []).some((p) => p.dia_semana === "Fijo" && !p._sintetico);
          const diasParaMostrar = tieneFijo ? [...diasUsados, "Fijo"] : diasUsados;
          const diasModoAdmin = al.rm?.dias_modo || "nombres";
          const diasDisponibles = [...DIAS_SEMANA.filter((d) => !diasUsados.includes(d)), ...(tieneFijo ? [] : ["Fijo"])];

          return (
            <div style={{ ...card, padding: 12 }}>
              <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 12 }}>
                Plan por día — {al.nombre}
              </div>
              {diasParaMostrar.length === 0 && (
                <div style={{ color: S.gray, fontSize: 12, marginBottom: 12 }}>
                  {al.nombre} todavía no tiene días de entrenamiento configurados. Sumá uno con "+ Agregar día", o configurá sus días fijos en Ejercicios → <Pencil size={12} style={{ verticalAlign: "-2px" }} /> Editar.
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {diasParaMostrar.map((dia, idx) => {
                  const planActual = al.planes?.find((p) => p.dia_semana === dia);
                  const isSelected = selectedDia === dia && !agregandoDia;
                  const labelPrincipal = dia === "Fijo" ? "Todos los días" : diasModoAdmin === "numerico" ? `Día ${idx + 1}` : dia;
                  return (
                    <div
                      key={dia}
                      onClick={() => { setSelectedDia(isSelected ? null : dia); setAgregandoDia(false); }}
                      style={{
                        background: isSelected ? S.card2 : S.card,
                        border: `1px solid ${isSelected ? S.white : S.border}`,
                        borderRadius: 8,
                        padding: "10px 12px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 11, color: S.gray, marginBottom: 3 }}>
                        {labelPrincipal}
                        {diasModoAdmin === "numerico" && dia !== "Fijo" && (
                          <span style={{ color: S.lgray }}> · {dia}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: planActual ? S.green : S.lgray, fontWeight: 600 }}>
                        {planActual ? planActual.nombre || "Asignado" : "Sin plan"}
                      </div>
                      {/* 2026-08-10 — el elegidor de plan salió de acá
                          adentro: los botones vivían dentro de un tile de
                          media columna (~165px en el celular) y ahí no
                          entra la descripción de cada variante, que es
                          justamente lo que explica para qué sirve cada
                          rutina. Ahora se despliega a ancho completo
                          debajo de la grilla (ver selectorDePlan). */}
                      {isSelected && (
                        <div style={{ fontSize: 11, color: S.white, marginTop: 6, fontWeight: 700 }}>Elegí el plan abajo ↓</div>
                      )}
                    </div>
                  );
                })}
                {/* Elegidor de plan a ancho completo, compartido por el
                    flujo de los tiles y por "+ Agregar día". */}
                {selectedDia && !agregandoDia && selectorDePlan(selectedDia)}
                {/* + Agregar día (punto 8): 2 pasos dentro del mismo tile
                    expandido — elegir el día de la semana disponible, y
                    después la plantilla (reusa asignarPlanDia con
                    diaOverride, sin pisar selectedDia de los tiles de
                    arriba). */}
                {!agregandoDia ? (
                  <div
                    onClick={() => { setAgregandoDia(true); setSelectedDia(null); }}
                    style={{ background: "transparent", border: "1px dashed " + S.border, borderRadius: 8, padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: S.gray, fontSize: 12, fontWeight: 700, minHeight: 44 }}
                  >
                    + Agregar día
                  </div>
                ) : !selectedDia ? (
                  <div style={{ ...card, padding: "10px 12px", gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: 11, color: S.gray, marginBottom: 8, textTransform: "uppercase" }}>Elegí el día para agregar</div>
                    {diasDisponibles.length === 0 ? (
                      <div style={{ color: S.gray, fontSize: 12, marginBottom: 8 }}>Ya están todos los días usados.</div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                        {diasDisponibles.map((d) => (
                          <button
                            key={d}
                            onClick={() => setSelectedDia(d)}
                            style={{ background: S.white, color: S.bg, border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            {d === "Fijo" ? "Todos los días" : d}
                          </button>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setAgregandoDia(false)} style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 6, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  selectorDePlan(selectedDia, true)
                )}
              </div>
              <div style={{ fontSize: 11, color: S.lgray }}>
                Tocá un día para asignarle un plan de entrenamiento
              </div>
            </div>
          );
        })()}{" "}
      </div>{" "}
    </>
  );
}
