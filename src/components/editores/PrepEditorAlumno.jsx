import { esPrepPropia, listaDeAlumno } from "../../utils/preparacion.js";
import { S, card, smallBtn } from "../../utils/theme.js";
import { EjercicioEditor } from "./EjercicioEditor.jsx";

// ── PREPARACIÓN DE UN ALUMNO (movilidad x3 · entrada en calor) ─────────
// 2026-08-10. Envuelve al EjercicioEditor de siempre con lo único que hacía
// falta para que el sistema de dos niveles no sea adivinanza: decir en la
// pantalla si esta lista es la predeterminada (y entonces un cambio en
// Biblioteca la actualiza sola) o si es propia de este alumno (y entonces no
// se toca nunca desde arriba), con la vuelta atrás a mano.
export function PrepEditorAlumno({ al, id, globales, onGuardar, onVolverGlobal, biblioteca, onGuardarBiblioteca, onGuardarParaTodos }) {
  const propia = esPrepPropia(al, id);
  const items = listaDeAlumno(al, id, globales);
  return (
    <div>
      <div style={{ ...card, padding: "10px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: propia ? S.white : S.green, fontWeight: 700 }}>
          {propia ? "Lista propia de este alumno" : "Heredada del predeterminado"}
        </span>
        <span style={{ fontSize: 13, color: S.gray, flex: 1, minWidth: 160 }}>
          {propia
            ? "Editar el predeterminado ya no le cambia nada."
            : "Si cambiás el predeterminado en Biblioteca, se le actualiza sola. Editar acá la vuelve propia."}
        </span>
        {propia && (
          <button onClick={() => onVolverGlobal(id)} style={smallBtn(S.gray)}>
            Volver al predeterminado
          </button>
        )}
      </div>
      <EjercicioEditor
        items={items}
        onChange={(v) => onGuardar(id, v)}
        showVideo={true}
        biblioteca={biblioteca}
        onGuardarBiblioteca={onGuardarBiblioteca}
        onGuardarParaTodos={onGuardarParaTodos}
      />
    </div>
  );
}
