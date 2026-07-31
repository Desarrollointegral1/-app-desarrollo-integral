import { useState, useEffect } from "react";
import { ClipboardList, Check, Move, Zap, Flame } from "lucide-react";
import { S, card, tabBtn, tabN2, segTrack, segChip, n4Track, chipN4 } from "../utils/theme.js";
import { RM_EJS, hoy, getYTId } from "../utils/helpers.js";
import { getAppConfig } from "../../services/supabase.js";
import { MOVILIDAD_ARTICULACIONES, MOVILIDAD_CORTA } from "../utils/planTemplates.js";
import ItemCard from "./ItemCard.jsx";
import ResumenPlanModal from "./ResumenPlanModal.jsx";

// Vista de la sesión del alumno, con DOS tabs del mismo tamaño (pills):
//   PREPARACIÓN — 3 sub-menús: Movilidad · Activación con elástico · Activación con peso
//      (al final de Movilidad, los videos de la rutina completa: corta/larga)
//   PRINCIPALES — los ejercicios principales, con peso anterior + peso de hoy
export default function PlanDelDia({
  plan,
  planValido,
  diasEntrena,
  dia,
  diaIdx,
  setDiaIdx,
  sem,
  semanaActual,
  pesos,
  historiales,
  onPeso,
  rm,
  onRegistrarDia,
  diaRegistrado,
  registrandoDia,
  irAPrincipales,
  // 2026-07-31 — selector de día de semana DENTRO de Principales (además de
  // las pills del header): mismo mecanismo, ver irADiaSemana en App.jsx.
  diasSemana,
  diaSemanaActivo,
  onIrADiaSemana,
  // 2026-07-31 — para mostrar el grupo muscular de cada ejercicio en el
  // resumen del plan (el dato vive en la biblioteca, no en el plan).
  biblioteca,
  // 2026-07-30 — Modo Entrenador: el entrenador opera la app durante la
  // clase y sólo necesita los ejercicios principales (la preparación la hace
  // el alumno solo). Default false para que si App.jsx todavía no pasa la
  // prop la vista del alumno quede exactamente igual que hoy.
  modoEntrenador = false,
}) {
  // null = "la primera sección visible según el orden del admin" (ronda 9)
  const [prep, setPrep] = useState(null);
  // 2026-07-31, pedido de Lucas: tocar el nombre del plan en Principales
  // abre un resumen con la periodización (objetivo básico del plan).
  const [showResumen, setShowResumen] = useState(false);
  // Versión de movilidad elegida por el alumno: superrapida (~3') · corta (~8') · completa (15'+).
  // Arranca en la PREDETERMINADA que el admin eligió para este alumno
  // (rm.movilidad_default, Admin → Plan → Movil.); el alumno puede cambiarla acá.
  // 2026-07-31 — Lucas: "que movilidad venga predeterminado en corta". Si el
  // admin configuró movilidad_default para este alumno, se respeta igual
  // (esta parte no cambia); el fallback cuando no hay nada configurado pasa
  // de "completa" a "corta".
  const [moviVersion, setMoviVersion] = useState(() =>
    ["superrapida", "corta", "completa"].includes(rm?.movilidad_default) ? rm.movilidad_default : "corta"
  );
  const [videosGlobal, setVideosGlobal] = useState(null);
  // Dos tabs del mismo tamaño: Preparación | Principales.
  const [seccion, setSeccion] = useState("preparacion");
  // 2026-07-30 — en Modo Entrenador no hay Preparación, así que tampoco hay
  // dos tabs que elegir: quedaría un tab huérfano marcando una jerarquía que
  // ya no existe. Se saltea el estado y se muestra Principales directo.
  const seccionActiva = modoEntrenador ? "principales" : seccion;

  // Videos de movilidad globales (Admin → Plan → Videos de movilidad).
  useEffect(() => {
    getAppConfig("videos_movilidad").then(setVideosGlobal);
  }, []);

  // Ronda 17 (punto 4): atajo desde las pills de día de la ficha del
  // alumno — "irAPrincipales" es un token que se incrementa en cada click
  // (no un booleano) para poder disparar el salto aunque el alumno ya esté
  // en Principales cuando toca otra pill de nuevo.
  useEffect(() => {
    if (irAPrincipales) {
      setSeccion("principales");
      // Ronda 18: además de activar la sección, scrollear hasta ella —
      // sin esto el usuario quedaba mirando la ficha de arriba y parecía
      // que el click en la pill "no hacía nada".
      setTimeout(() => {
        const el = document.getElementById("di-plan-seccion");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  }, [irAPrincipales]);

  const movilidad = plan?.movilidad || [];
  const calor = plan?.calor || [];
  const activacion = plan?.activacion || [];

  // Último peso registrado ANTES de hoy (para comparar contra el de hoy)
  const pesoAnteriorDe = (ejId) => {
    const previos = (historiales[ejId] || []).filter((h) => h.fecha && h.fecha < hoy() && Number(h.peso) > 0);
    return previos.length > 0 ? previos[previos.length - 1] : null;
  };

  const VideoCard = ({ tipo, defaultDur, mv }) => {
    const url = mv?.url || "";
    const ytId = getYTId(url);
    return (
      <div style={{ ...card, padding: "14px 12px", textAlign: "center" }}>
        <div style={{ color: S.white, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{tipo}</div>
        <div style={{ color: S.gray, fontSize: 15, marginBottom: 10, fontWeight: 600 }}>{mv?.duracion || defaultDur}</div>
        {ytId ? (
          <div style={{ borderRadius: 6, overflow: "hidden", position: "relative", paddingTop: "56.25%", background: "#000" }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`Rutina de movilidad ${tipo}`}
            />
          </div>
        ) : url ? (
          <video controls style={{ width: "100%", borderRadius: 6, display: "block" }}>
            <source src={url} type="video/mp4" />
          </video>
        ) : (
          <div style={{ padding: "14px 0", color: S.lgray || S.gray, fontSize: 15 }}>Video pendiente</div>
        )}
      </div>
    );
  };

  if (!planValido && movilidad.length === 0 && calor.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: S.gray }}>
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}><ClipboardList size={40} strokeWidth={2} /></div>
        <div style={{ color: S.white, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
          Todavía no tenés plan asignado
        </div>
        <div style={{ fontSize: 15 }}>Hablá con tu entrenador para que configure tu rutina.</div>
      </div>
    );
  }

  // Videos: lo cargado por plan pisa lo global; lo global es lo normal.
  const videos = {
    superrapida: plan?.movilidad_videos?.superrapida?.url ? plan.movilidad_videos.superrapida : videosGlobal?.superrapida,
    corta: plan?.movilidad_videos?.corta?.url ? plan.movilidad_videos.corta : videosGlobal?.corta,
    larga: plan?.movilidad_videos?.larga?.url ? plan.movilidad_videos.larga : (videosGlobal?.larga || videosGlobal?.avanzada),
  };

  // Las 3 versiones de movilidad (CEREBRO-ENTRENAMIENTO 3.1 y 3.5): el alumno
  // elige según el tiempo que tiene; cada una con sus ejercicios y su video.
  // 2026-07-31, pedido de Lucas: subtítulo propio para cada versión (qué
  // hace/para qué sirve), no solo el detalle de repeticiones.
  const MOVI_VERSIONES = [
    { id: "superrapida", label: "Superrápida", subtitulo: "Activación express de tu cuerpo", detalle: { prefijo: "activación express:", cantidad: 5, tipo: "lado" }, items: MOVILIDAD_ARTICULACIONES, video: videos.superrapida, videoDur: "3 min" },
    { id: "corta", label: "Corta", subtitulo: "Pensada para conectar con tu cuerpo", detalle: { cantidad: 6, tipo: "lado", sufijo: "(versión corta)" }, items: MOVILIDAD_CORTA, video: videos.corta, videoDur: "8 min" },
    { id: "completa", label: "Completa", subtitulo: "Para mejorar tu movilidad total", detalle: { cantidad: 6, tipo: "lado" }, items: movilidad, video: videos.larga, videoDur: "15+ min" },
  ];
  const moviActiva = MOVI_VERSIONES.find((v) => v.id === moviVersion) || MOVI_VERSIONES[2];

  // Ronda 9: secciones renombradas (Movilidad · Act. Elástico · Entrada en
  // calor) y el ADMIN puede ocultar/reordenar secciones por alumno vía
  // rm.secciones_config = { orden: ["movilidad","banda","peso"], ocultas: [] }.
  const PREP_TABS_BASE = [
    { id: "movilidad", label: "Movilidad", icono: Move, detalle: moviActiva.detalle, items: moviActiva.items },
    // 2026-07-31, pedido de Lucas: "Act. Elástico se va a llamar Elástico" +
    // subtítulo breve al entrar a la sección.
    { id: "banda", label: "Elástico", icono: Zap, subtitulo: "Activación de articulaciones con elástico", detalle: { cantidad: 5, tipo: "brazo" }, items: calor },
    { id: "peso", label: "Calor", icono: Flame, subtitulo: "Entrada en calor con peso", detalle: { cantidad: 5, tipo: null }, items: activacion },
  ];
  const cfg = rm?.secciones_config || {};
  const ordenCfg = (Array.isArray(cfg.orden) ? cfg.orden : []).filter((id) => PREP_TABS_BASE.some((t) => t.id === id));
  PREP_TABS_BASE.forEach((t) => { if (!ordenCfg.includes(t.id)) ordenCfg.push(t.id); });
  const ocultas = Array.isArray(cfg.ocultas) ? cfg.ocultas : [];
  const PREP_TABS = ordenCfg
    .map((id) => PREP_TABS_BASE.find((t) => t.id === id))
    .filter((t) => t && !ocultas.includes(t.id));
  const prepActiva = PREP_TABS.find((t) => t.id === prep) || PREP_TABS[0] || null;

  // Selector de día (Lunes/Miércoles/Viernes... o Día 1/Día 2/Día 3...) —
  // SOLO aplica a Principales (Preparación es igual todos los días). Ronda
  // 11: se ubica debajo de la ficha de stats, no arriba del todo. Punto 9
  // (2026-07-21): el admin elige por alumno el modo de etiquetado —
  // rm.dias_modo === "numerico" muestra "Día 1/Día 2/..." en vez del
  // nombre real del día (para alumnos sin horario fijo).
  const diasModo = rm?.dias_modo === "numerico" ? "numerico" : "nombres";
  // 2026-07-30 — Modo Entrenador: el entrenador necesita las DOS lecturas a
  // la vez ("Día 2" es como se habla en la clase, "Miércoles" es cómo lo
  // busca en la agenda), así que no se elige una u otra: se apilan.
  // El nombre real del día puede estar en el sub-día (`d.dia`, planes viejos
  // con varios días adentro) o ser el `dia_semana` del plan (estructura
  // actual: un alumno_plan por día). Se toma el que efectivamente sea un día
  // de la semana; si ninguno lo es (ej. "Sesion", "Fijo") no se inventa nada.
  const DIAS_SEM = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const esDiaSemana = (s) =>
    DIAS_SEM.includes((s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim());
  const nombreDiaDe = (d) =>
    esDiaSemana(d?.dia) ? d.dia : esDiaSemana(plan?.dia_semana) ? plan.dia_semana : "";
  const SelectorDia = () =>
    planValido && plan.dias.length > 1 ? (
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {plan.dias.map((d, i) => {
          const activo = diaIdx === i;
          const nombre = nombreDiaDe(d);
          return (
            <button key={i} onClick={() => setDiaIdx(i)} style={{ ...tabBtn(activo), flex: 1, lineHeight: 1.25 }}>
              {modoEntrenador ? (
                <>
                  <div>{`Día ${i + 1}`}</div>
                  {nombre && (
                    <div style={{ fontSize: 15, fontWeight: 500, opacity: activo ? 0.7 : 1, color: activo ? S.bg : S.gray }}>
                      {nombre}
                    </div>
                  )}
                </>
              ) : diasModo === "numerico" ? (
                `Día ${i + 1}`
              ) : (
                d.dia
              )}
            </button>
          );
        })}
      </div>
    ) : null;

  return (
    <div id="di-plan-seccion">
      {/* ── Tabs nivel 2: PREPARACIÓN | PRINCIPALES — activo con borde blanco
          + fondo card, sin invertir (jerarquía visual ronda 6) ── */}
      {!modoEntrenador && (
        <div style={{ display: "flex", gap: 8, margin: "4px 0 12px" }}>
          {[
            ["preparacion", "Preparación"],
            ["principales", "Principales"],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setSeccion(id)} style={tabN2(seccion === id)}>
              {label}
            </button>
          ))}
        </div>
      )}

      {seccionActiva === "preparacion" && (PREP_TABS.length === 0 || !prepActiva ? (
        <div style={{ ...card, padding: "24px 16px", textAlign: "center", color: S.gray, fontSize: 15 }}>
          Tu entrenador no habilitó secciones de preparación. Pasá directo a Principales.
        </div>
      ) : (
        <>
          {/* Sub-menús de Preparación — respetan orden y visibilidad que el
              admin configuró para este alumno (ronda 9) */}
          {/* 2026-07-31, pedido de Lucas: "implementa lo mismo en movilidad
              elástico y calor" — mismo lenguaje ícono+label que ya se usa en
              el menú Diario/Bioimpedancia. */}
          <div style={{ ...segTrack(), marginBottom: 8 }}>
            {PREP_TABS.map((t) => {
              const activo = prepActiva.id === t.id;
              const Icono = t.icono;
              // 2026-07-31 — Lucas notó que a "Movilidad" (la palabra más
              // larga de las 3) le faltaba el ícono: segChip() trae
              // overflow:hidden pensado para texto plano, y en un chip de
              // ancho igual (flex:1) "MOVILIDAD" + ícono no entraban — el
              // ícono, primer hijo, quedaba recortado. overflow:visible acá
              // y el truncado (si hiciera falta) se lo dejamos al span de
              // texto, no al botón entero.
              return (
                <button key={t.id} onClick={() => setPrep(t.id)} style={{ ...segChip(activo), overflow: "visible", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  {Icono && <Icono size={13} style={{ flexShrink: 0 }} />}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>
                </button>
              );
            })}
          </div>
          {/* 2026-07-31, pedido de Lucas: "abajo de Movilidad/Elástico/Calor
              que ya diga 6 repeticiones por lado FIJA" — caption fija, igual
              sin importar cuál de las 3 esté activa (a diferencia del
              subtítulo de más abajo, que sí cambia por sección/versión). */}
          <div style={{ color: S.gray, fontSize: 14, textAlign: "center", marginBottom: 8 }}>
            6 repeticiones por lado
          </div>
          {/* Selector de versión de movilidad — nivel 4 (ronda 11): sub-menú
              DENTRO de Movilidad, con un estilo más chico/sutil (texto +
              subrayado) para que no se confunda con el segmented control de
              nivel 3 de arriba (Movilidad/Act. Elástico/Entrada en calor). */}
          {prepActiva.id === "movilidad" && (
            <div style={{ ...n4Track(), marginBottom: 10 }}>
              {MOVI_VERSIONES.map((v) => (
                <button key={v.id} onClick={() => setMoviVersion(v.id)} style={chipN4(moviVersion === v.id)}>
                  {v.label}
                </button>
              ))}
            </div>
          )}
          {/* 2026-07-31, pedido de Lucas: al entrar a Elástico/Calor (o elegir
              una versión de Movilidad), un subtítulo breve de qué es/para qué
              sirve — distinto de la caption fija de arriba. */}
          {/* 2026-07-31 — Lucas: "sacá 6 repeticiones por lado abajo antes de
              empezar con los ejercicios, quedó duplicado. El cambio era
              poner el nuevo y sacar el antiguo, solo pusiste el nuevo."
              El <RepsLabel/> dinámico que vivía acá decía lo mismo que la
              caption fija de arriba — se saca, queda solo la de arriba. */}
          {(prepActiva.id === "movilidad" ? moviActiva.subtitulo : prepActiva.subtitulo) && (
            <div style={{ color: S.white, fontWeight: 700, fontSize: 15, textAlign: "center", marginBottom: 10 }}>
              {prepActiva.id === "movilidad" ? moviActiva.subtitulo : prepActiva.subtitulo}
            </div>
          )}
          {prepActiva.items.length === 0 ? (
            <div style={{ ...card, padding: "24px 16px", textAlign: "center", color: S.gray, fontSize: 15 }}>
              Sin ejercicios en esta parte
            </div>
          ) : (
            prepActiva.items.map((ej, i) => (
              <ItemCard
                key={i}
                numero={i + 1}
                nombre={(ej.nombre || "").replace(/\s*\(banda\)/gi, "").trim()}
                desc={ej.desc}
                video={ej.video}
                mediaLocal={ej.mediaLocal}
                gif={ej.gif}
              />
            ))
          )}
          {/* Video de la versión elegida, al final de Movilidad */}
          {prepActiva.id === "movilidad" && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 15, color: S.gray, letterSpacing: 2, textTransform: "uppercase", textAlign: "center", marginBottom: 10 }}>
                Rutina con el profe
              </div>
              <VideoCard tipo={moviActiva.label} defaultDur={moviActiva.videoDur} mv={moviActiva.video} />
            </div>
          )}
        </>
      ))}

      {/* ── PRINCIPALES ── */}
      {seccionActiva === "principales" && (!planValido || !dia ? (
        /* Auditoría 2026-07-30. Este mensaje decía sólo "Sin ejercicios
           principales asignados" y era la razón por la que parecía que los
           GIFs de los ejercicios no funcionaban: el alumno entra un día que
           no le toca, no ve NADA, y no hay forma de saber si es que no tiene
           plan o es que hoy no entrena. Ahora se distinguen los dos casos y,
           si entrena otros días, se dicen cuáles. */
        <div style={{ ...card, padding: "24px 20px", textAlign: "center", color: S.gray, fontSize: 16, lineHeight: 1.5 }}>
          {(() => {
            // Tres casos distintos, no dos. El alumno puede entrenar HOY y
            // aun asi no tener plan cargado para hoy (le pasa a Agustina:
            // entrena martes/jueves/sabado y solo tiene plan del martes).
            // Decirle "hoy no te toca" cuando si le toca es peor que no
            // decir nada.
            const sinDias = !diasEntrena || diasEntrena.length === 0;
            if (sinDias) {
              return (
                <>
                  <div style={{ color: S.white, fontWeight: 700, marginBottom: 6 }}>Todavía no tenés plan asignado</div>
                  Hablá con tu entrenador para que te cargue la rutina.
                </>
              );
            }
            const limpia = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
            const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
            const hoyNombre = DIAS[new Date().getDay()];
            const entrenaHoy = diasEntrena.some((d) => limpia(d) === hoyNombre);
            return entrenaHoy ? (
              <>
                <div style={{ color: S.white, fontWeight: 700, marginBottom: 6 }}>Hoy entrenás, pero todavía no tenés la rutina cargada</div>
                Avisale a tu entrenador. Mientras tanto podés hacer la preparación: está en la pestaña de al lado.
              </>
            ) : (
              <>
                <div style={{ color: S.white, fontWeight: 700, marginBottom: 6 }}>Hoy no te toca entrenar</div>
                Entrenás los <span style={{ color: S.white, fontWeight: 700 }}>{diasEntrena.join(" · ")}</span>.
                <div style={{ marginTop: 10 }}>Si querés moverte igual, hacé la preparación: está en la pestaña de al lado.</div>
              </>
            );
          })()}
        </div>
      ) : (
        <>
          {/* 2026-07-31, pedido de Lucas: "necesito que puedan elegir el día
              que quiere entrenar ahí abajo" — si faltó un día, tiene que
              poder saltar directo al que le toca sin scrollear arriba.
              Aclaración de Lucas: "martes/jueves/sábado ya aparece arriba,
              acá tiene que ser por día O SESIÓN" — mismo mecanismo
              (onIrADiaSemana) pero con label "Día N" en vez de repetir el
              nombre del día de semana, para no duplicar la info del header. */}
          {diasSemana && diasSemana.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {diasSemana.map((h, i) => {
                const norm = (s) => (s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
                const activo = diaSemanaActivo ? norm(diaSemanaActivo) === norm(h.dia) : i === 0 && !diaSemanaActivo;
                return (
                  <button key={i} onClick={() => onIrADiaSemana && onIrADiaSemana(h.dia)} title={`Ir a ${h.dia}`} style={{ ...tabBtn(activo), flex: 1 }}>
                    Día {i + 1}
                  </button>
                );
              })}
            </div>
          )}
          {/* 2026-07-31, pedido de Lucas: esta ficha (series x reps ·
              intensidad · ejercicios) repetía exactamente los mismos datos
              que ya muestra el ribbon de la ficha del alumno arriba de las
              tabs Entrenamiento/Historial — se sacó de acá. */}
          <SelectorDia />
          {/* 2026-07-31 — Lucas: "esa ficha me gustaría que esté más
              centrada abajo de los días" — tocar el nombre del plan abre el
              resumen (ejercicios + grupo muscular + periodización). */}
          {dia.subtitulo && (
            <button
              onClick={() => setShowResumen(true)}
              style={{ display: "block", width: "100%", textAlign: "center", background: "transparent", border: "none", color: S.gray, fontSize: 15, marginBottom: 10, padding: 0, cursor: "pointer", textDecoration: "underline" }}
            >
              {dia.subtitulo}
            </button>
          )}
          {(dia.ejercicios || []).map((ej, i) => {
            const rmKey = RM_EJS.find(
              (k) =>
                ej.nombre.toLowerCase().includes(k.toLowerCase().split(" ")[0]) ||
                k.toLowerCase().includes(ej.nombre.toLowerCase().split(" ")[0]),
            );
            const rmDato = rmKey && rm && rm[rmKey];
            const pct = sem.intensidad ? Number(sem.intensidad.replace("%", "")) : null;
            const pesoSugerido = rmDato && rmDato.peso > 0 && pct ? Math.round((rmDato.peso * pct) / 100) : null;
            return (
              <ItemCard
                key={ej.id}
                numero={i + 1}
                nombre={ej.nombre}
                desc={ej.desc}
                video={ej.video}
                mediaLocal={ej.mediaLocal}
                gif={ej.gif}
                showPeso
                semana={sem}
                peso={pesos[ej.id] || 0}
                historial={historiales[ej.id] || []}
                pesoAnterior={pesoAnteriorDe(ej.id)}
                onPesoChange={(v) => onPeso(ej.id, v)}
                pesoSugerido={pesoSugerido}
                intensidad={sem.intensidad}
                unidad={ej.unidad}
              />
            );
          })}
          {/* ── REGISTRAR DÍA (ronda 8): cierre de la sesión de hoy. Los pesos
              se autoguardan igual mientras se cargan; este botón confirma la
              sesión: re-sincroniza los pesos de hoy, marca la asistencia si no
              estaba, y deja el día como registrado. ── */}
          {onRegistrarDia && (
            <button
              onClick={onRegistrarDia}
              disabled={registrandoDia}
              style={{
                width: "100%",
                marginTop: 16,
                background: diaRegistrado ? S.green : S.white,
                color: diaRegistrado ? "#fff" : S.bg,
                border: "none",
                borderRadius: 12,
                padding: "16px 24px",
                fontSize: 15,
                fontWeight: 900,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                cursor: registrandoDia ? "default" : "pointer",
                opacity: registrandoDia ? 0.7 : 1,
                transition: "all 0.3s",
              }}
            >
              {registrandoDia ? "REGISTRANDO..." : diaRegistrado ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={14} strokeWidth={2} />DÍA REGISTRADO</span>
              ) : "REGISTRAR DÍA"}
            </button>
          )}
          {onRegistrarDia && (
            <div style={{ fontSize: 15, color: S.lgray, textAlign: "center", marginTop: 8 }}>
              {diaRegistrado
                ? "La sesión de hoy quedó registrada en tu historial. Podés volver a tocar si cambiaste algún peso."
                : "Tus pesos se van guardando solos. Este botón cierra y registra la sesión de hoy."}
            </div>
          )}
        </>
      ))}
      {/* 2026-07-31, pedido de Lucas: resumen del plan (ejercicios + grupo
          muscular + periodización) al tocar el nombre del plan. Componente
          compartido — el mismo se abre desde la pantalla de Bienvenida. */}
      {showResumen && (
        <ResumenPlanModal plan={plan} dia={dia} onClose={() => setShowResumen(false)} />
      )}
    </div>
  );
}
