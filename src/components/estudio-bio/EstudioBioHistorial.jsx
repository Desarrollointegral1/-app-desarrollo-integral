// Movido textualmente desde EstudioBio.jsx (refactor 2026-08-18): mismo código,
// solo cambió de archivo. EstudioBio.jsx conserva EstudioBioSeccion (la sección completa).
import { Calendar, FileText, Inbox, Trash2 } from "lucide-react";
import { card, S } from "../../utils/theme.js";
import { formatoRango } from "../../utils/energia.js";
import { getSignedUrl } from "../../../services/supabase.js";
import { generarFlyerBio } from "../../utils/flyerBio.js";
import { BioFoto } from "./BioFoto.jsx";
import { BIO_BUCKET } from "./helpers.js";

// Historial de estudios: métricas + conclusión/objetivo + foto.
// `alumnoFlyer`: si viene (admin), cada registro muestra "Generar flyer" —
// el documento de una página con marca DI para mandarle al alumno. Se
// regenera siempre desde el registro (conclusión/objetivo viven en metadata).
export function EstudioBioHistorial({ registros, onEliminar, onEditar, alumnoFlyer, showToast, mostrarRequerimiento = false }) {
  if (!registros || registros.length === 0) {
    return (
      <div style={{ ...card, padding: "40px 16px", textAlign: "center" }}>
        <div style={{ marginBottom: 8, display: "flex", justifyContent: "center", color: S.gray }}><Inbox size={24} strokeWidth={2} /></div>
        <div style={{ color: S.gray, fontSize: 12 }}>Sin estudios registrados aún</div>
      </div>
    );
  }
  return (
    <div>
      {registros.map((bio) => {
        // "Estudio anterior" (foto + fecha subida por Lucas, sin medición
        // propia): se marca distinto para no mostrar una grilla de 6 métricas
        // todas en "—", que se lee como un registro roto.
        const esAnterior = bio.metadata?.tipo === "estudio_anterior";
        const esScan = bio.metadata?.tipo === "scan_2fotos";
        return (
        <div key={bio.id} style={{ ...card, padding: "12px 14px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: S.lgray, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Calendar size={14} strokeWidth={2} />{bio.fecha} {bio.hora ? `· ${String(bio.hora).slice(0, 5)}` : ""}
              {esAnterior && <span style={{ color: S.gray, textTransform: "uppercase", letterSpacing: 1, fontSize: 9 }}>· Estudio anterior</span>}
              {esScan && <span style={{ color: S.gray, textTransform: "uppercase", letterSpacing: 1, fontSize: 9 }}>· Scan 2 fotos (IA)</span>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {alumnoFlyer && !esAnterior && (
                <button
                  onClick={async () => {
                    // El flyer es HTML estático: la foto no puede resolver el
                    // signed URL sola, se resuelve acá antes de generarlo.
                    const fotoUrl = await getSignedUrl(BIO_BUCKET, bio.archivo_url);
                    generarFlyerBio(alumnoFlyer, { ...bio, archivo_url: fotoUrl });
                    showToast && showToast("Flyer generado — abrilo y guardalo como PDF");
                  }}
                  style={{ background: S.white, color: S.bg, border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <FileText size={16} strokeWidth={2} />Generar flyer
                </button>
              )}
              {onEditar && (
                <button
                  onClick={() => onEditar(bio)}
                  style={{ background: "transparent", color: S.lgray, border: "1px solid " + S.border, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  Editar
                </button>
              )}
              {onEliminar && (
                <button
                  onClick={() => onEliminar(bio)}
                  style={{ background: "transparent", color: S.red, border: "1px solid " + S.red, borderRadius: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                >
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
          {!esAnterior && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[
                ["Peso", bio.peso, " kg"],
                ["IMC", bio.imc, ""],
                ["Grasa", bio.grasa_corporal, "%"],
                ["Visceral", bio.grasa_visceral, ""],
                ["Músculo", bio.masa_muscular, "%"],
                ["Estatura", bio.altura, " cm"],
              ].map(([labelTxt, val, unit]) => (
                <div key={labelTxt} style={{ textAlign: "center", background: S.card2, borderRadius: 6, padding: "6px 4px" }}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 12 }}>
                    {val != null && val !== "" ? `${val}${unit}` : "—"}
                  </div>
                  <div style={{ color: S.gray, fontSize: 8, marginTop: 2 }}>{labelTxt}</div>
                </div>
              ))}
            </div>
          )}
          {bio.metadata?.conclusion && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, color: S.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Conclusión</div>
              <div style={{ color: S.white, fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{bio.metadata.conclusion}</div>
            </div>
          )}
          {bio.metadata?.objetivo && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 9, color: S.lgray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Objetivo de mejora</div>
              <div style={{ color: S.white, fontSize: 12, lineHeight: 1.5 }}>{bio.metadata.objetivo}</div>
            </div>
          )}
          {/* Solo entrenador: el número de kcal se lee como prescripción y la
              alerta es un indicador de riesgo RED-S. Gateado a propósito, no
              por el hecho de que hoy no exista una vista de alumno. */}
          {mostrarRequerimiento && bio.metadata?.requerimiento && (
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  fontSize: 9,
                  color: bio.metadata.requerimiento.alerta_piso ? S.yellow : S.gray,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                Requerimiento energético
              </div>
              <div style={{ color: S.white, fontSize: 12, lineHeight: 1.5 }}>
                {formatoRango(bio.metadata.requerimiento.rango_ajustado || bio.metadata.requerimiento.rango)}
              </div>
              {bio.metadata.requerimiento.alerta_piso && (
                <div style={{ color: S.yellow, fontSize: 11, marginTop: 3, lineHeight: 1.4 }}>
                  Por debajo del piso de 30 kcal/kg de masa magra.
                </div>
              )}
            </div>
          )}
          {bio.archivo_url && <BioFoto bio={bio} />}
        </div>
        );
      })}
    </div>
  );
}
