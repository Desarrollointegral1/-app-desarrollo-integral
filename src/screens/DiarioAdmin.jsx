import { useState } from "react";
import { NotebookPen } from "lucide-react";
import { AlumnoBuscador } from "../components/AlumnoBuscador.jsx";
import { EntradaDiarioAdmin } from "../components/EntradaDiarioAdmin.jsx";
import { S, card } from "../utils/theme.js";

export function DiarioAdmin({ alumnos, onUpdate, showToast }) {
  const [selId, setSelId] = useState(alumnos[0]?.id);
  const al = alumnos.find((a) => a.id === selId) || alumnos[0];
  const entradas = [...(al?.diario || [])].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const responder = (entrada, respuesta) => {
    if (!al || !onUpdate) return;
    const nuevoDiario = (al.diario || []).map((d) => (d === entrada ? { ...d, respuesta } : d));
    onUpdate(alumnos.map((a) => (a.id === al.id ? { ...a, diario: nuevoDiario } : a)));
    showToast && showToast("Respuesta guardada");
  };

  return (
    <div>
      <AlumnoBuscador alumnos={alumnos} selId={selId} onSelect={setSelId} />
      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Diario — {al?.nombre}
      </div>
      {entradas.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: "center" }}>
          <NotebookPen size={28} style={{ marginBottom: 8 }} />
          <div style={{ color: S.gray, fontSize: 13 }}>Sin entradas todavía</div>
        </div>
      ) : (
        entradas.map((e, i) => (
          <EntradaDiarioAdmin key={e.fecha + "-" + i} entrada={e} onResponder={(r) => responder(e, r)} />
        ))
      )}
    </div>
  );
}
