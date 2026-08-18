import { Ban, Dumbbell, Megaphone, Pencil, Power, Settings, Stethoscope } from "lucide-react";
import { actualizarAdmin, actualizarRolAdmin, crearAdmin, crearNovedad, desactivarAdmin, eliminarNovedad, toggleNovedad } from "../../../services/supabase.js";
import { card, inp, S, segChip, segTrack, smallBtn } from "../../utils/theme.js";
import { NovedadesAdmin } from "../NovedadesAdmin.jsx";
import { PIN_TRIVIAL } from "./helpers.js";

// Sección "config" del AdminPanel. Solo JSX: todo el estado y los
// handlers viven en AdminPanel.jsx y llegan por props (refactor 2026-08-17).
export function SeccionConfig({
  abrirEdicionAdmin,
  admCodigo,
  adminsList,
  admNombre,
  admPin,
  admRol,
  cargarAdminsList,
  configTab,
  editAdminPin,
  editandoAdminId,
  editCodigo,
  editNombre,
  novedades,
  onNovedadesChange,
  setAdmCodigo,
  setAdminsList,
  setAdmNombre,
  setAdmPin,
  setAdmRol,
  setConfigTab,
  setEditAdminPin,
  setEditandoAdminId,
  setEditCodigo,
  setEditNombre,
  setSec,
  showToast,
}) {
  return (
    <div>
      {/* Ronda 18: Configuración no tenía forma de volver al menú
          anterior — botón Volver explícito (además el click en el
          logo del header también vuelve al Dashboard). */}
      <button
        onClick={() => setSec("dashboard")}
        style={{ ...smallBtn(S.gray), marginBottom: 12, fontSize: 13, padding: "8px 14px" }}
      >
        ← Volver al panel
      </button>
      {/* Sub-tabs */}
      <div style={{ ...segTrack(), marginBottom: 16 }}>
        {/* "Configuración" incluye crear Y editar admins, no solo alta. */}
        {[[<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Settings size={14} />Configuración</span>, "admin"], [<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Megaphone size={14} />Comunicados</span>, "comunicados"]].map(([l, k]) => (
          <button key={k} onClick={() => setConfigTab(k)} style={segChip(configTab === k)}>
            {l}
          </button>
        ))}
      </div>

      {configTab === "admin" && (
        <div>
          <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
            Crear administrador
          </div>
          {[
            ["Nombre", admNombre, setAdmNombre],
            ["Username", admCodigo, setAdmCodigo],
            ["Clave (4 dígitos)", admPin, setAdmPin],
          ].map(([label, val, set]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
              {/* Auditoría 2026-07-30: la clave del admin son 4 dígitos
                  → teclado numérico. Nombre/Username sin autocompletar:
                  son datos de OTRA persona, no del dueño del celular. */}
              <input
                type={label.includes("Clave") ? "password" : "text"}
                inputMode={label.includes("Clave") ? "numeric" : undefined}
                autoComplete={label.includes("Clave") ? "new-password" : "off"}
                value={val}
                onChange={(e) => set(e.target.value)}
                style={inp}
                maxLength={label.includes("Clave") ? 4 : undefined}
              />
            </div>
          ))}
          {/* Rol (punto 12): por ahora solo queda como dato asignable
              y visible — no restringe la vista todavía. */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 6 }}>Rol</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["entrenador", <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Dumbbell size={14} />Entrenador</span>], ["kinesiologa", <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Stethoscope size={14} />Kinesióloga</span>]].map(([id, l]) => (
                <button
                  key={id}
                  onClick={() => setAdmRol(id)}
                  style={{ flex: 1, background: admRol === id ? S.white : S.card, color: admRol === id ? S.bg : S.gray, border: "1px solid " + (admRol === id ? S.white : S.border), borderRadius: 8, padding: "9px 6px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={async () => {
              if (admPin.length === 4 && PIN_TRIVIAL(admPin)) {
                showToast && showToast("Elegí una clave de admin menos obvia (nada de 1234 o 0000)");
                return;
              }
              if (!admNombre || !admCodigo || admPin.length !== 4) {
                showToast && showToast("Completá todos los campos (clave de 4 dígitos)");
                return;
              }
              try {
                await crearAdmin(admNombre, admCodigo, admPin, "", admRol);
                showToast && showToast(`Admin "${admNombre}" creado`);
                setAdmNombre(""); setAdmCodigo(""); setAdmPin(""); setAdmRol("entrenador");
                cargarAdminsList();
              } catch (e) {
                showToast && showToast("Error: " + e.message);
              }
            }}
            style={{ width: "100%", background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 14, fontSize: 14, fontWeight: 900, cursor: "pointer" }}
          >
            CREAR ADMINISTRADOR
          </button>

          {/* Gestión de admins existentes (punto 12): listado con
              selector de rol por admin. */}
          <div style={{ fontSize: 11, color: S.gray, letterSpacing: 2, textTransform: "uppercase", margin: "24px 0 12px" }}>
            Administradores ({adminsList.length})
          </div>
          {adminsList.map((a) => (
            <div key={a.id} style={{ ...card, padding: "10px 12px", marginBottom: 8, opacity: a.activo === false ? 0.55 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 13 }}>{a.nombre}{a.activo === false ? " · inactivo" : ""}</div>
                  <div style={{ color: S.gray, fontSize: 11 }}>@{a.codigo}</div>
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {[["entrenador", <Dumbbell size={14} />], ["kinesiologa", <Stethoscope size={14} />]].map(([id, ic]) => (
                    <button
                      key={id}
                      title={id === "entrenador" ? "Entrenador" : "Kinesióloga"}
                      onClick={async () => {
                        if (a.rol === id) return;
                        const actualizado = await actualizarRolAdmin(a.id, id);
                        if (actualizado) {
                          setAdminsList((prev) => prev.map((x) => (x.id === a.id ? { ...x, rol: id } : x)));
                          showToast && showToast(`${a.nombre} ahora es ${id === "entrenador" ? "Entrenador" : "Kinesióloga"}`);
                        } else {
                          showToast && showToast("Error al cambiar el rol");
                        }
                      }}
                      style={{ background: a.rol === id ? S.white : "transparent", color: a.rol === id ? S.bg : S.gray, border: "1px solid " + (a.rol === id ? S.white : S.border), borderRadius: 6, padding: "6px 9px", fontSize: 13, cursor: "pointer" }}
                    >
                      {ic}
                    </button>
                  ))}
                  {/* Ronda 16 (punto 2): editar nombre/username/clave de un admin
                      ya creado. */}
                  <button
                    title="Modificar datos"
                    onClick={() => abrirEdicionAdmin(a)}
                    style={{ background: editandoAdminId === a.id ? S.white : "transparent", color: editandoAdminId === a.id ? S.bg : S.gray, border: "1px solid " + (editandoAdminId === a.id ? S.white : S.border), borderRadius: 6, padding: "6px 9px", fontSize: 13, cursor: "pointer" }}
                  >
                    <Pencil size={14} />
                  </button>
                  {/* Desactivar/reactivar admin (auditoría 2026-07-22: no se
                      podía sacar un admin desde la UI). Un admin inactivo no
                      puede loguearse (verify_login_pin respeta `activo`). */}
                  <button
                    title={a.activo === false ? "Reactivar admin" : "Desactivar admin"}
                    onClick={async () => {
                      const reactivar = a.activo === false;
                      if (!reactivar && !window.confirm(`¿Desactivar a ${a.nombre}? No va a poder entrar hasta que lo reactives.`)) return;
                      try {
                        await desactivarAdmin(a.id, reactivar);
                        setAdminsList((prev) => prev.map((x) => (x.id === a.id ? { ...x, activo: reactivar } : x)));
                        showToast && showToast(reactivar ? `${a.nombre} reactivado` : `${a.nombre} desactivado`);
                      } catch (e) { showToast && showToast("No se pudo cambiar el estado"); }
                    }}
                    style={{ background: "transparent", color: a.activo === false ? S.green : S.red, border: "1px solid " + (a.activo === false ? S.green : S.border), borderRadius: 6, padding: "6px 9px", fontSize: 13, cursor: "pointer" }}
                  >
                    {a.activo === false ? <Power size={14} /> : <Ban size={14} />}
                  </button>
                </div>
              </div>
              {editandoAdminId === a.id && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid " + S.border }}>
                  {[
                    ["Nombre", editNombre, setEditNombre, "text"],
                    ["Username", editCodigo, setEditCodigo, "text"],
                    ["Nueva clave (dejar vacío para no cambiarla)", editAdminPin, setEditAdminPin, "password"],
                  ].map(([label, val, set, type]) => (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 14, color: S.gray, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                      {/* Auditoría 2026-07-30: idem — la clave es
                          numérica de 4 dígitos, teclado numérico. */}
                      <input
                        type={type}
                        inputMode={type === "password" ? "numeric" : undefined}
                        autoComplete={type === "password" ? "new-password" : "off"}
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        style={inp}
                        maxLength={type === "password" ? 4 : undefined}
                      />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={async () => {
                        if (!editNombre.trim() || !editCodigo.trim()) {
                          showToast && showToast("Nombre y username son obligatorios");
                          return;
                        }
                        if (editAdminPin && editAdminPin.length !== 4) {
                          showToast && showToast("La clave nueva debe tener 4 dígitos");
                          return;
                        }
                        if (editAdminPin && PIN_TRIVIAL(editAdminPin)) {
                          showToast && showToast("Elegí una clave menos obvia (nada de 1234 o 0000)");
                          return;
                        }
                        try {
                          await actualizarAdmin(a.id, editNombre, editCodigo, editAdminPin);
                          showToast && showToast(`${editNombre} actualizado`);
                          setEditandoAdminId(null);
                          cargarAdminsList();
                        } catch (e) {
                          showToast && showToast("Error: " + e.message);
                        }
                      }}
                      style={{ flex: 1, background: S.white, color: S.bg, border: "none", borderRadius: 8, padding: 11, fontSize: 13, fontWeight: 900, cursor: "pointer" }}
                    >
                      GUARDAR CAMBIOS
                    </button>
                    <button
                      onClick={() => setEditandoAdminId(null)}
                      style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 8, padding: "11px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {configTab === "comunicados" && (
        <NovedadesAdmin
          novedades={novedades}
          onCrear={async (n) => {
            try {
              const nueva = await crearNovedad(n);
              onNovedadesChange([nueva, ...novedades]);
              showToast && showToast("Comunicado publicado");
            } catch (e) { showToast && showToast("Error: " + e.message); }
          }}
          onToggle={async (id, activo) => {
            await toggleNovedad(id, activo);
            onNovedadesChange(novedades.map((n) => n.id === id ? { ...n, activo } : n));
          }}
          onEliminar={async (id) => {
            if (!window.confirm("¿Eliminar este comunicado?")) return;
            await eliminarNovedad(id);
            onNovedadesChange(novedades.filter((n) => n.id !== id));
            showToast && showToast("Eliminado");
          }}
        />
      )}
    </div>
  );
}
