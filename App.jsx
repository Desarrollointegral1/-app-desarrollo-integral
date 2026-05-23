import { useState, useEffect } from "react";
import {
  loginConCodigo,
  loginAdmin,
  cargarDatos,
  insertAlumno,
  deleteAlumno,
} from "./services/supabase.js";
import {
  cargarEntrenamientos,
  guardarEntrenamiento,
  guardarRegistroDiario,
  cargarRegistrosDiarios,
  guardarBioimpedancia,
  cargarBioimpedancia,
  generarReporteMensual,
} from "./services/supabase-new-features.js";
import { S, card, inp, tabBtn } from "./src/utils/theme.js";

// ── EJERCICIOS PRINCIPALES (FIJOS) ────────────────────────────────────────
const EJERCICIOS_FIJOS = [
  { id: 'hombro', nombre: 'Hombro', icono: '💪' },
  { id: 'dom_rodilla', nombre: 'Dominante de Rodilla', icono: '🦵' },
  { id: 'pecho', nombre: 'Pecho', icono: '🔱' },
  { id: 'dom_cadera', nombre: 'Dominante de Cadera', icono: '🍑' },
  { id: 'espalda', nombre: 'Espalda', icono: '🔙' },
  { id: 'gluteos', nombre: 'Glúteos', icono: '🍑' },
];

const ICON_WHITE = "data:image/svg+xml,%3Csvg id='a' xmlns='http://www.w3.org/2000/svg' width='1500' height='1500' viewBox='0 0 1500 1500'%3E%3Cg%3E%3Cpath d='M749.86,1171.008v9.548s-.04-1.818-.16-5.254c.04-1.238.1-2.657.16-4.295Z' fill='%23fff'/%3E%3Cg%3E%3Cpath d='M1100.176,457.931c-1.646,2.291-66.952,91.918-156.767,161.748-43.672,33.954-80.83,75.699-107.653,124.079-17.779,32.068-34.14,70.471-44.945,115.028-31.642,130.562-39.392,274.368-40.95,312.222-.06,1.638-.12,3.056-.16,4.295-.06-1.238-.12-2.657-.18-4.295-1.558-37.854-9.309-181.66-40.95-312.222-11.623-47.953-29.689-88.78-49.034-122.25-26.185-45.303-61.486-84.632-102.803-116.74-89.891-69.855-155.269-159.576-156.909-161.865,3.036,2.697,197.94,176.187,350.116,176.287h.12c152.176-.1,347.08-173.59,350.116-176.287Z' fill='%23fff'/%3E%3Cpath d='M749.7,1175.303c-.14,3.436-.18,5.254-.18,5.254v-9.548c.06,1.638.12,3.056.18,4.295Z' fill='%23fff'/%3E%3C/g%3E%3C/g%3E%3Ccircle cx='750.001' cy='508.788' r='69.377' fill='%23fff'/%3E%3Cpath d='M689.368,1062.142s-6.193-178.398-52.626-271.706c-60.339-121.251-203.315-204.621-203.315-204.621,0,0,97.15,96.045,163.424,228.592,66.274,132.547,92.518,247.736,92.518,247.736Z' fill='%23fff'/%3E%3Cpath d='M810.874,1062.142s6.193-178.398,52.626-271.706c60.339-121.251,203.315-204.621,203.315-204.621,0,0-97.15,96.045-163.424,228.592-66.274,132.547-92.518,247.736-92.518,247.736Z' fill='%23fff'/%3E%3C/svg%3E";

const ICON_BLACK = "data:image/svg+xml,%3Csvg id='a' xmlns='http://www.w3.org/2000/svg' width='1500' height='1500' viewBox='0 0 1500 1500'%3E%3Cg%3E%3Cpath d='M749.86,1171.008v9.548s-.04-1.818-.16-5.254c.04-1.238.1-2.657.16-4.295Z'/%3E%3Cg%3E%3Cpath d='M1100.176,457.931c-1.646,2.291-66.952,91.918-156.767,161.748-43.672,33.954-80.83,75.699-107.653,124.079-17.779,32.068-34.14,70.471-44.945,115.028-31.642,130.562-39.392,274.368-40.95,312.222-.06,1.638-.12,3.056-.16,4.295-.06-1.238-.12-2.657-.18-4.295-1.558-37.854-9.309-181.66-40.95-312.222-11.623-47.953-29.689-88.78-49.034-122.25-26.185-45.303-61.486-84.632-102.803-116.74-89.891-69.855-155.269-159.576-156.909-161.865,3.036,2.697,197.94,176.187,350.116,176.287h.12c152.176-.1,347.08-173.59,350.116-176.287Z'/%3E%3Cpath d='M749.7,1175.303c-.14,3.436-.18,5.254-.18,5.254v-9.548c.06,1.638.12,3.056.18,4.295Z'/%3E%3C/g%3E%3C/g%3E%3Ccircle cx='750.001' cy='508.788' r='69.377'/%3E%3Cpath d='M689.368,1062.142s-6.193-178.398-52.626-271.706c-60.339-121.251-203.315-204.621-203.315-204.621,0,0,97.15,96.045,163.424,228.592,66.274,132.547,92.518,247.736,92.518,247.736Z'/%3E%3Cpath d='M810.874,1062.142s6.193-178.398,52.626-271.706c60.339-121.251,203.315-204.621,203.315-204.621,0,0-97.15,96.045-163.424,228.592-66.274,132.547-92.518,247.736-92.518,247.736Z'/%3E%3C/svg%3E";

let ICON = ICON_WHITE;

// ── TOAST ─────────────────────────────────────────────────────────────────
function Toast({ msg, type = 'info' }) {
  if (!msg) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: type === 'error' ? '#e53e3e' : '#48bb78',
        color: '#fff',
        padding: "12px 16px",
        borderRadius: 8,
        fontSize: 14,
        zIndex: 9999,
        animation: "fadeInOut 3s ease-in-out",
      }}
    >
      {msg}
    </div>
  );
}

// ── LOGIN SCREEN ──────────────────────────────────────────────────────────
function Login({ onLogin, onAdmin }) {
  const [codigo, setCodigo] = useState("");
  const [pin, setPin] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!codigo || !pin) {
      setError("Código y PIN requeridos");
      return;
    }
    setLoading(true);
    try {
      if (isAdmin) {
        const admin = await loginAdmin(codigo, pin);
        onAdmin(admin);
      } else {
        const alumno = await loginConCodigo(codigo, pin);
        // Cargar entrenamientos
        const entrenamientos = await cargarEntrenamientos(alumno.id);
        alumno.entrenamientos = entrenamientos;
        onLogin(alumno);
      }
    } catch (e) {
      setError(e.message || "Error en login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: S.bg,
        gap: 24,
        padding: 16,
      }}
    >
      <img src={ICON} alt="DI" style={{ width: 80, height: 80 }} />
      <h1 style={{ color: S.text, margin: 0 }}>Desarrollo Integral</h1>

      <div style={{ width: "100%", maxWidth: 300 }}>
        <input
          type="text"
          placeholder="Código (ej: DI-001)"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          style={{ ...inp, marginBottom: 12, width: "100%" }}
        />
        <input
          type="password"
          placeholder="PIN (4 dígitos)"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={4}
          style={{ ...inp, marginBottom: 16, width: "100%" }}
        />

        <label style={{ color: S.text, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          Acceso Admin
        </label>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            ...card,
            background: S.white,
            color: S.bg,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            width: "100%",
            padding: "12px 16px",
            fontWeight: "bold",
            fontSize: 14,
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {error && <div style={{ color: "#e53e3e", marginTop: 12, textAlign: "center" }}>{error}</div>}
      </div>
    </div>
  );
}

// ── TAB EJERCICIOS ────────────────────────────────────────────────────────
function TabEjercicios({ alumno, entrenamiento, onSave }) {
  const [pesos, setPesos] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      await guardarRegistroDiario(
        alumno.id,
        hoy,
        entrenamiento?.numero_dia || 1,
        null, // presente (se actualiza en tab presencia)
        null, // comentario
        pesos
      );
      onSave("Pesos guardados ✓");
    } catch (e) {
      onSave("Error al guardar: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!entrenamiento) {
    return <div style={{ padding: 16, color: S.gray }}>No hay entrenamiento asignado</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ color: S.text, marginBottom: 16 }}>
        Plan {entrenamiento.tipo_plan === 'bilateral' ? 'Bilateral' : 'Unilateral'}
      </h3>

      <div style={{ display: "grid", gap: 12 }}>
        {EJERCICIOS_FIJOS.map((ej) => (
          <div key={ej.id} style={{ ...card, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{ej.icono}</span>
              <span style={{ color: S.text, fontWeight: "bold" }}>{ej.nombre}</span>
            </div>
            <input
              type="number"
              placeholder="Peso máximo (kg)"
              value={pesos[ej.id] || ""}
              onChange={(e) => setPesos({ ...pesos, [ej.id]: parseFloat(e.target.value) || 0 })}
              style={{ ...inp, width: "100%" }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        style={{
          ...card,
          background: S.white,
          color: S.bg,
          border: "none",
          width: "100%",
          padding: 12,
          marginTop: 16,
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Guardando..." : "Guardar pesos"}
      </button>
    </div>
  );
}

// ── TAB PRESENCIA ─────────────────────────────────────────────────────────
function TabPresencia({ alumno, onSave }) {
  const [presente, setPresente] = useState(false);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      await guardarRegistroDiario(
        alumno.id,
        hoy,
        null, // numero_dia (mantener del registro anterior)
        presente,
        comentario,
        null // pesos (mantener del registro anterior)
      );
      onSave("Presencia registrada ✓");
    } catch (e) {
      onSave("Error al guardar: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ ...card, padding: 16, marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={presente}
            onChange={(e) => setPresente(e.target.checked)}
          />
          <span style={{ color: S.text, fontWeight: "bold" }}>Presente hoy</span>
        </label>
      </div>

      <div style={{ ...card, padding: 16, marginBottom: 16 }}>
        <label style={{ color: S.text, display: "block", marginBottom: 8, fontWeight: "bold" }}>
          Comentario del día
        </label>
        <textarea
          placeholder="Notas del entrenamiento..."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          style={{
            ...inp,
            width: "100%",
            minHeight: 100,
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        style={{
          ...card,
          background: S.white,
          color: S.bg,
          border: "none",
          width: "100%",
          padding: 12,
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}

// ── TAB BIOIMPEDANCIA ─────────────────────────────────────────────────────
function TabBioimpedancia({ alumno, onSave }) {
  const [datos, setDatos] = useState({
    grasaCorporal: "",
    masaMuscular: "",
    peso: "",
    agua: "",
    nota: "",
  });
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarBioimpedancia(alumno.id, 30).then(setHistorial);
  }, [alumno.id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      await guardarBioimpedancia(alumno.id, hoy, datos);
      setDatos({ grasaCorporal: "", masaMuscular: "", peso: "", agua: "", nota: "" });
      const updated = await cargarBioimpedancia(alumno.id, 30);
      setHistorial(updated);
      onSave("Bioimpedancia registrada ✓");
    } catch (e) {
      onSave("Error al guardar: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const campos = [
    { key: "grasaCorporal", label: "Grasa corporal (%)", type: "number", step: "0.1" },
    { key: "masaMuscular", label: "Masa muscular (%)", type: "number", step: "0.1" },
    { key: "peso", label: "Peso (kg)", type: "number", step: "0.1" },
    { key: "agua", label: "Agua (%)", type: "number", step: "0.1" },
  ];

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ color: S.text, marginBottom: 16 }}>Registrar análisis corporal</h3>

      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        {campos.map((campo) => (
          <div key={campo.key}>
            <label style={{ color: S.gray, fontSize: 12, display: "block", marginBottom: 4 }}>
              {campo.label}
            </label>
            <input
              type={campo.type}
              step={campo.step}
              value={datos[campo.key]}
              onChange={(e) => setDatos({ ...datos, [campo.key]: e.target.value })}
              style={{ ...inp, width: "100%" }}
            />
          </div>
        ))}

        <div>
          <label style={{ color: S.gray, fontSize: 12, display: "block", marginBottom: 4 }}>
            Nota
          </label>
          <textarea
            placeholder="Observaciones..."
            value={datos.nota}
            onChange={(e) => setDatos({ ...datos, nota: e.target.value })}
            style={{ ...inp, width: "100%", minHeight: 60, fontFamily: "inherit" }}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        style={{
          ...card,
          background: S.white,
          color: S.bg,
          border: "none",
          width: "100%",
          padding: 12,
          marginBottom: 24,
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Guardando..." : "Guardar"}
      </button>

      <h3 style={{ color: S.text, marginBottom: 12 }}>Historial</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {historial.slice(0, 5).map((reg) => (
          <div key={reg.id} style={{ ...card, padding: 12 }}>
            <div style={{ fontSize: 12, color: S.gray, marginBottom: 8 }}>{reg.fecha}</div>
            <div style={{ color: S.text, fontSize: 13 }}>
              🔍 {reg.grasa_corporal}% grasa | 💪 {reg.masa_muscular}% músculo | ⚖️ {reg.peso}kg | 💧 {reg.agua}%
            </div>
            {reg.nota && <div style={{ fontSize: 12, color: S.gray, marginTop: 4 }}>{reg.nota}</div>}
          </div>
        ))}
        {historial.length === 0 && (
          <div style={{ color: S.gray, textAlign: "center", padding: 20 }}>Sin registros</div>
        )}
      </div>
    </div>
  );
}

// ── TAB REPORTES ──────────────────────────────────────────────────────────
function TabReportes({ alumno }) {
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarReporte();
  }, [mes, alumno.id]);

  const cargarReporte = async () => {
    setLoading(true);
    try {
      const data = await generarReporteMensual(alumno.id, mes);
      setReporte(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ ...card, padding: 12, marginBottom: 16 }}>
        <label style={{ color: S.gray, fontSize: 12, display: "block", marginBottom: 4 }}>
          Mes
        </label>
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          style={{ ...inp, width: "100%" }}
        />
      </div>

      {loading && <div style={{ color: S.gray, textAlign: "center" }}>Cargando...</div>}

      {reporte && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ ...card, padding: 16, textAlign: "center" }}>
            <div style={{ color: S.gray, fontSize: 12 }}>Asistencia</div>
            <div style={{ color: S.white, fontSize: 28, fontWeight: "bold" }}>
              {reporte.asistencia} días
            </div>
          </div>

          <div style={{ ...card, padding: 16 }}>
            <div style={{ color: S.gray, fontSize: 12, marginBottom: 12 }}>Pesos máximos promedio</div>
            {Object.entries(reporte.pesos_maximos).map(([ej, peso]) => (
              <div
                key={ej}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: S.text,
                  fontSize: 13,
                  marginBottom: 8,
                }}
              >
                <span style={{ textTransform: "capitalize" }}>{ej.replace('_', ' ')}</span>
                <span style={{ fontWeight: "bold" }}>{peso} kg</span>
              </div>
            ))}
          </div>

          {reporte.comentarios.length > 0 && (
            <div style={{ ...card, padding: 16 }}>
              <div style={{ color: S.gray, fontSize: 12, marginBottom: 12 }}>Comentarios del mes</div>
              <div style={{ display: "grid", gap: 8 }}>
                {reporte.comentarios.slice(0, 5).map((com, i) => (
                  <div key={i} style={{ color: S.text, fontSize: 13, borderLeft: `2px solid ${S.white}`, paddingLeft: 8 }}>
                    {com}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD ALUMNO ──────────────────────────────────────────────────────
function DashboardAlumno({ alumno, onLogout }) {
  const [tab, setTab] = useState("ejercicios");
  const [entrenamiento, setEntrenamiento] = useState(null);
  const [numeroDia, setNumeroDia] = useState(1);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (alumno.entrenamientos && alumno.entrenamientos.length > 0) {
      setEntrenamiento(alumno.entrenamientos[numeroDia - 1]);
    }
  }, [numeroDia, alumno.entrenamientos]);

  const diasDisponibles = alumno.entrenamientos?.map((e) => e.numero_dia) || [1];

  return (
    <div style={{ minHeight: "100vh", background: S.bg, paddingBottom: 80 }}>
      {/* HEADER */}
      <div style={{ ...card, margin: 16, padding: 16, marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h2 style={{ color: S.white, margin: 0 }}>{alumno.nombre}</h2>
            <div style={{ color: S.gray, fontSize: 12 }}>
              Día {numeroDia} - Plan {entrenamiento?.tipo_plan === 'bilateral' ? 'Bilateral' : 'Unilateral'}
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: "transparent",
              border: `1px solid ${S.white}`,
              color: S.white,
              padding: "6px 12px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Salir
          </button>
        </div>

        {diasDisponibles.length > 1 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
            {diasDisponibles.map((dia) => (
              <button
                key={dia}
                onClick={() => setNumeroDia(dia)}
                style={{
                  ...tabBtn,
                  background: numeroDia === dia ? S.white : S.card,
                  color: numeroDia === dia ? S.bg : S.gray,
                  whiteSpace: "nowrap",
                }}
              >
                Día {dia}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 8, padding: "8px 16px", overflowX: "auto", marginBottom: 8 }}>
        {[
          { id: "ejercicios", label: "Ejercicios", icon: "💪" },
          { id: "presencia", label: "Presencia", icon: "✓" },
          { id: "bioimpedancia", label: "Análisis", icon: "📊" },
          { id: "reportes", label: "Reportes", icon: "📈" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...tabBtn,
              background: tab === t.id ? S.white : "transparent",
              color: tab === t.id ? S.bg : S.gray,
              border: `1px solid ${tab === t.id ? S.white : S.border}`,
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      {tab === "ejercicios" && <TabEjercicios alumno={alumno} entrenamiento={entrenamiento} onSave={setToast} />}
      {tab === "presencia" && <TabPresencia alumno={alumno} onSave={setToast} />}
      {tab === "bioimpedancia" && <TabBioimpedancia alumno={alumno} onSave={setToast} />}
      {tab === "reportes" && <TabReportes alumno={alumno} />}

      <Toast msg={toast.split("|")[0]} type={toast.split("|")[1] || "info"} />
    </div>
  );
}

// ── ADMIN PANEL ───────────────────────────────────────────────────────────
function AdminPanel({ admin, onLogout }) {
  const [tab, setTab] = useState("alumnos");
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const cargarAlumnos = async () => {
    try {
      const data = await cargarDatos([]);
      setAlumnos(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: S.bg, padding: 16, paddingBottom: 80 }}>
      <div style={{ ...card, padding: 16, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: S.white, margin: 0 }}>Admin Panel</h2>
        <button
          onClick={onLogout}
          style={{
            background: "transparent",
            border: `1px solid ${S.white}`,
            color: S.white,
            padding: "6px 12px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Salir
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "alumnos", label: "Alumnos" },
          { id: "entrenamientos", label: "Entrenamientos" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...tabBtn,
              background: tab === t.id ? S.white : "transparent",
              color: tab === t.id ? S.bg : S.gray,
              border: `1px solid ${tab === t.id ? S.white : S.border}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "alumnos" && (
        <div>
          <h3 style={{ color: S.text }}>Gestión de alumnos</h3>
          <p style={{ color: S.gray }}>Función para crear, editar y eliminar alumnos (próximamente)</p>
        </div>
      )}

      {tab === "entrenamientos" && (
        <div>
          <h3 style={{ color: S.text }}>Asignar entrenamientos</h3>
          <p style={{ color: S.gray }}>Función para asignar días de entrenamiento y planes (próximamente)</p>
        </div>
      )}
    </div>
  );
}

// ── APP PRINCIPAL ─────────────────────────────────────────────────────────
export default function App() {
  const [alumno, setAlumno] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") !== "false");

  useEffect(() => {
    applyTheme(darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const applyTheme = (dark) => {
    ICON = dark ? ICON_WHITE : ICON_BLACK;
  };

  if (alumno) {
    return <DashboardAlumno alumno={alumno} onLogout={() => setAlumno(null)} />;
  }

  if (admin) {
    return <AdminPanel admin={admin} onLogout={() => setAdmin(null)} />;
  }

  return (
    <>
      <Login onLogin={setAlumno} onAdmin={setAdmin} />
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
          10% { opacity: 1; transform: translateX(-50%) translateY(0); }
          90% { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      `}</style>
    </>
  );
}
