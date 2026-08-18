// Bloque "Gasto energético estimado" del formulario de estudio (antes JSX inline
// dentro del return de EstudioBioForm). Solo JSX: `req` lo calcula el formulario y llega por prop.
// Movido textualmente desde EstudioBio.jsx (refactor 2026-08-18): mismo código,
// solo cambió de archivo. EstudioBio.jsx conserva EstudioBioSeccion (la sección completa).
import { Flame, TriangleAlert } from "lucide-react";
import { innerCard, S } from "../../utils/theme.js";
import { DISCLAIMER_REQUERIMIENTO, formatoRango } from "../../utils/energia.js";

export function PanelRequerimiento({ req }) {
  return (
    <div style={{ ...innerCard, padding: "12px 14px", marginTop: 14 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Flame size={14} strokeWidth={2} color={S.gray} />
        <span style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
          Gasto energético estimado
        </span>
      </span>

      {!req ? (
        <div style={{ fontSize: 11, color: S.lgray, marginTop: 8, lineHeight: 1.5 }}>
          Completá edad, estatura, peso, sexo y nivel de actividad para calcular.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: req.tmb_cunningham ? "1fr 1fr" : "1fr",
              gap: 6,
              marginTop: 10,
            }}
          >
            <div style={{ textAlign: "center", background: S.card3, borderRadius: 6, padding: "6px 4px" }}>
              <div style={{ color: S.white, fontWeight: 700, fontSize: 12 }}>{req.tmb} kcal</div>
              <div style={{ color: S.gray, fontSize: 8, marginTop: 2 }}>TMB MIFFLIN</div>
            </div>
            {req.tmb_cunningham && (
              <div style={{ textAlign: "center", background: S.card3, borderRadius: 6, padding: "6px 4px" }}>
                <div style={{ color: S.white, fontWeight: 700, fontSize: 12 }}>{req.tmb_cunningham} kcal</div>
                <div style={{ color: S.gray, fontSize: 8, marginTop: 2 }}>TMB CUNNINGHAM</div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: S.white, lineHeight: 1 }}>
              {formatoRango(req.rango)}
            </div>
            <div style={{ fontSize: 10, color: S.gray, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>
              Gasto total estimado · mantenimiento
            </div>
          </div>

          {req.rango_ajustado && req.objetivo !== "mantener" && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: S.white, lineHeight: 1 }}>
                {formatoRango(req.rango_ajustado)}
              </div>
              <div style={{ fontSize: 10, color: S.gray, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>
                {req.objetivo === "bajar_grasa" ? "Rango ajustado · déficit 300–1000" : "Rango ajustado · superávit 300–500"}
              </div>
            </div>
          )}

          {req.alerta_piso && (
            <div
              style={{
                marginTop: 10,
                background: S.card,
                borderLeft: "3px solid " + S.yellow,
                borderRadius: 8,
                padding: "10px 12px",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <TriangleAlert size={14} strokeWidth={2} color={S.yellow} />
                <span style={{ fontSize: 12, fontWeight: 700, color: S.yellow }}>
                  Por debajo del piso de seguridad hormonal
                </span>
              </span>
              <div style={{ fontSize: 11, color: S.white, lineHeight: 1.5, marginTop: 4 }}>
                El límite inferior del rango ({req.rango_ajustado ? req.rango_ajustado[0] : req.rango[0]} kcal) queda
                por debajo de 30 kcal por kg de masa magra ({req.piso_kcal} kcal sobre {req.masa_magra} kg). Revisar
                el objetivo antes de sostenerlo.
              </div>
            </div>
          )}

          <div
            style={{
              borderTop: "1px solid " + S.border,
              paddingTop: 8,
              marginTop: 12,
              fontSize: 11,
              color: S.gray,
              lineHeight: 1.45,
            }}
          >
            {DISCLAIMER_REQUERIMIENTO}
          </div>
        </>
      )}
    </div>
  );
}
