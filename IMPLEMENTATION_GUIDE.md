# Implementación Rediseño v2 - Guía Step-by-Step

## ✅ COMPLETADO

### Paso 1: Migraciones SQL ✓
- Archivo: `migrations.sql`
- Tablas creadas/modificadas:
  - `bioimpedancia` - Agregados campos: peso, grasa_corporal, masa_muscular, grasa_visceral, imc, edad, hora, altura
  - `registros_diarios` - Tabla para registro diario de pesos y asistencia
  - `entrenamientos` - Tabla para planes por día
  - `alumnos` - Agregado `plan_type` campo

### Paso 2: Funciones Supabase ✓
- Archivo: `services/supabase.js`
- Nuevas funciones agregadas:
  - `assignPlanToStudent(alumno_id, plan_type)` - Asignar plan bilateral/unilateral
  - `saveDailyWeight(alumno_id, fecha, ejercicio_id, peso)` - Guardar peso para un día
  - `saveDailyAttendance(alumno_id, fecha, presente)` - Marcar asistencia
  - `saveBioimpedanciaCompleta(alumno_id, datos)` - Guardar medición completa
  - `cargarBioimpedanciaCompleta(alumno_id, limit)` - Cargar histórico bioimpedancia
  - `cargarPesosPorDia(alumno_id, limit)` - Cargar pesos históricos por día
  - `getMonthlyReport(alumno_id, mes_yyyy_mm)` - Generar reporte mensual

## ⏳ PRÓXIMOS PASOS

### Paso 3: Modificar App.jsx - Plan Assignment en Admin

**Ubicación:** En la sección `{alumnosTab === "perfil"...}` dentro del AdminPanel

**Agregar después de la sección de datos de alumno (alrededor de línea 3037):**

```javascript
{/* NUEVA SECCIÓN: ASIGNAR PLAN */}
{!form && (
  <div style={{ ...card, padding: "14px 16px", marginTop: 10 }}>
    <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 10, letterSpacing: 1 }}>
      Plan Actual: {al.plan_type || "bilateral"}
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      {[["Bilateral", "bilateral"], ["Unilateral", "unilateral"]].map(([label, type]) => (
        <button
          key={type}
          onClick={async () => {
            const updated = await assignPlanToStudent(al.id, type);
            if (updated) {
              onUpdate(alumnos.map(a => a.id === al.id ? { ...a, plan_type: type } : a));
              showToast && showToast(`Plan ${label} asignado ✓`);
            }
          }}
          style={{
            flex: 1,
            background: (al.plan_type || "bilateral") === type ? S.white : S.card,
            color: (al.plan_type || "bilateral") === type ? S.bg : S.gray,
            border: "1px solid " + ((al.plan_type || "bilateral") === type ? S.white : S.border),
            borderRadius: 8,
            padding: "10px 4px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
)}
```

### Paso 4: Modificar App.jsx - Agregar Tab "Reportes" al Admin

**Ubicación:** En la sección de main admin tabs (alrededor de línea 2830)

**Cambiar la lista de tabs de:**
```javascript
{[["📊 Dashboard", "dashboard"], ...
```

**A:**
```javascript
{[
  ["📊 Dashboard", "dashboard"],
  ["👥 Alumnos", "alumnos"],
  ["📈 Reportes", "reportes"],  // NUEVO
  ["🏋️ Planes", "planes"],       // NUEVO
  ["📖 Biblioteca", "biblioteca"],
  ["⚡ RM", "rm"],
  ["📆 Historial", "historial"],
  ["📓 Diario", "diario"],
  ["🩺 Bioimpedancia", "bioimpedancia"],
  ["⚙️ Config", "config"]
].map(([l, k]) => secBtn(l, k))}
```

### Paso 5: Implementar Tab "Reportes"

**Agregar esta nueva sección en AdminPanel (antes del cierre del return):**

```javascript
{sec === "reportes" && al && (
  <div>
    <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
      <button
        onClick={() => setSec("dashboard")}
        style={{ background: "transparent", color: S.gray, border: "1px solid " + S.border, borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}
      >← Volver</button>
      <input
        type="month"
        defaultValue={new Date().toISOString().slice(0, 7)}
        onChange={(e) => setSelectedMes(e.target.value)}
        style={{ ...inp, flex: 1 }}
      />
    </div>

    {reporteData && (
      <div>
        {/* Asistencias */}
        <div style={{ ...card, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 10 }}>Asistencias</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: S.card2, borderRadius: 8, padding: "12px", textAlign: "center" }}>
              <div style={{ color: S.green, fontWeight: 700, fontSize: 18 }}>{reporteData.asistencias}</div>
              <div style={{ color: S.gray, fontSize: 10, marginTop: 4 }}>Presentes</div>
            </div>
            <div style={{ background: S.card2, borderRadius: 8, padding: "12px", textAlign: "center" }}>
              <div style={{ color: S.white, fontWeight: 700, fontSize: 18 }}>{reporteData.porcentajeAsistencia}%</div>
              <div style={{ color: S.gray, fontSize: 10, marginTop: 4 }}>Porcentaje</div>
            </div>
          </div>
        </div>

        {/* Bioimpedancia */}
        {reporteData.ultimaBioimpedancia && (
          <div style={{ ...card, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 10 }}>Última Bioimpedancia</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["Peso", reporteData.ultimaBioimpedancia.peso, "kg"],
                ["Grasa", reporteData.ultimaBioimpedancia.grasa_corporal, "%"],
                ["Músculo", reporteData.ultimaBioimpedancia.masa_muscular, "%"],
                ["Visceral", reporteData.ultimaBioimpedancia.grasa_visceral, ""]
              ].map(([label, val, unit]) => (
                <div key={label} style={{ background: S.card2, borderRadius: 8, padding: "10px", textAlign: "center" }}>
                  <div style={{ color: S.white, fontWeight: 700, fontSize: 14 }}>{val || "—"}{unit}</div>
                  <div style={{ color: S.gray, fontSize: 9, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pesos Máximos */}
        <div style={{ ...card, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: S.gray, textTransform: "uppercase", marginBottom: 10 }}>Pesos Máximos</div>
          {Object.entries(reporteData.pesosPromedio).map(([ejercicio, data]) => (
            <div key={ejercicio} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: S.white, fontWeight: 700, marginBottom: 4, textTransform: "capitalize" }}>
                {ejercicio}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                <div style={{ background: S.card2, borderRadius: 6, padding: "8px", textAlign: "center" }}>
                  <div style={{ color: S.white, fontWeight: 700 }}>{data.maximo}</div>
                  <div style={{ color: S.gray, fontSize: 9 }}>Máximo</div>
                </div>
                <div style={{ background: S.card2, borderRadius: 6, padding: "8px", textAlign: "center" }}>
                  <div style={{ color: S.white, fontWeight: 700 }}>{data.promedio}</div>
                  <div style={{ color: S.gray, fontSize: 9 }}>Promedio</div>
                </div>
                <div style={{ background: S.card2, borderRadius: 6, padding: "8px", textAlign: "center" }}>
                  <div style={{ color: S.white, fontWeight: 700 }}>{data.registros}</div>
                  <div style={{ color: S.gray, fontSize: 9 }}>Registros</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}
```

### Paso 6: Actualizar estado AdminPanel

**En el useState inicial de AdminPanel (alrededor de línea 2615), agregar:**
```javascript
const [selectedMes, setSelectedMes] = useState(new Date().toISOString().slice(0, 7));
const [reporteData, setReporteData] = useState(null);
```

**Agregar useEffect para cargar reporte cuando cambia el mes:**
```javascript
useEffect(() => {
  if (sec === "reportes" && al && selectedMes) {
    getMonthlyReport(al.id, selectedMes).then(data => {
      setReporteData(data);
    }).catch(err => {
      console.error("Error cargando reporte:", err);
      showToast && showToast("Error al cargar reporte");
    });
  }
}, [sec, al?.id, selectedMes]);
```

### Paso 7: Importar nuevas funciones

**En el topo de App.jsx, agregar a las importaciones de supabase:**
```javascript
import {
  // ... funciones existentes ...
  assignPlanToStudent,
  saveDailyWeight,
  saveDailyAttendance,
  saveBioimpedanciaCompleta,
  cargarBioimpedanciaCompleta,
  cargarPesosPorDia,
  getMonthlyReport
} from "./services/supabase";
```

## 🎯 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. ✅ Ejecutar migrations.sql en Supabase SQL Editor
2. ✅ Verificar que las nuevas funciones en supabase.js están importadas correctamente
3. ⏳ Agregar plan assignment UI al AdminPanel (Paso 3)
4. ⏳ Agregar nuevos tabs al AdminPanel (Paso 4)
5. ⏳ Implementar tab Reportes (Paso 5)
6. ⏳ Actualizar estudiante tabs: Ejercicios, Asistencia, Bioimpedancia, Pesos
7. ⏳ Aplicar diseño premium (emil-design-eng, ui-ux-pro-max)
8. ⏳ Testing y deployment

## 🔧 RECURSOS

- Migrations file: `migrations.sql`
- Service functions: `services/supabase.js`
- Main component: `App.jsx`
- Theme: `src/utils/theme.js`

## 📝 NOTAS

- Las nuevas funciones de Supabase están listas para usar
- Las migraciones deben ejecutarse en orden
- Los cambios en App.jsx deben integrarse cuidadosamente en el código existente
- Después de cada cambio importante, hacer commit a git y testear en desarrollo

