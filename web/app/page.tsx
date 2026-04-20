import Image from "next/image";

const APP_URL = "https://app-desarrollo-integral.vercel.app";

export default function Home() {
  return (
    <div className="bg-black text-white min-h-screen font-sans">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-sm px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Image src="/logos/DI-TYPEFACE.svg" alt="Desarrollo Integral" width={160} height={28} priority />
          <div className="flex items-center gap-4 md:gap-6 text-sm text-gray-400">
            <a href="#metodo" className="hidden md:block hover:text-white transition-colors">Método</a>
            <a href="#plataforma" className="hidden md:block hover:text-white transition-colors">Plataforma</a>
            <a href="#equipo" className="hidden md:block hover:text-white transition-colors">Equipo</a>
            <a href={APP_URL} className="border border-white text-white px-4 py-1.5 text-sm font-medium hover:bg-white hover:text-black transition-colors">
              Ingresar
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="flex flex-col items-center justify-center flex-1 py-32 w-full">
          <Image src="/logos/DI-ICON-SOLO.svg" alt="Desarrollo Integral" width={72} height={72} className="mb-10 opacity-80" priority />
          <p className="text-xs tracking-[0.35em] text-gray-600 uppercase mb-8">Wellness starts with movement</p>
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] mb-8 max-w-3xl tracking-tight">
            Fuerza, movimiento<br />y rendimiento<br className="hidden md:block" /> a largo plazo.
          </h1>
          <p className="text-gray-500 text-base md:text-lg max-w-md mb-12 leading-relaxed">
            Planes de entrenamiento personalizados, con seguimiento y registro completo de cada proceso.
          </p>
          <a href={APP_URL} className="bg-white text-black px-12 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-gray-100 transition-colors">
            Acceder a la plataforma
          </a>
        </div>
        <div className="w-full max-w-3xl mx-auto pb-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-t border-white/10 pt-12">
          {[
            ["30+", "años de experiencia"],
            ["100%", "planes individuales"],
            ["Datos reales", "para cada ajuste"],
            ["Proceso", "medido y registrado"],
          ].map(([num, label]) => (
            <div key={label}>
              <div className="text-2xl font-bold mb-1">{num}</div>
              <div className="text-xs text-gray-600 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* IDENTIDAD */}
      <section className="py-32 px-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-8">Qué es Desarrollo Integral</p>
          <p className="text-2xl md:text-3xl font-light leading-relaxed text-gray-200 mb-8">
            Un centro de entrenamiento y un método de trabajo desarrollado a partir de más de 30 años de experiencia.
          </p>
          <div className="border-l border-white/20 pl-6 space-y-4 text-gray-400 text-base leading-relaxed">
            <p>No se trabaja con planes genéricos.</p>
            <p>Cada alumno entrena con un <strong className="text-white">plan de entrenamiento personalizado</strong>, diseñado según su punto de partida, sus objetivos y su evolución.</p>
            <p>El foco está en construir un cuerpo fuerte, funcional y adaptable en el tiempo.</p>
          </div>
        </div>
      </section>

      {/* DIFERENCIAL */}
      <section className="py-20 px-6 bg-white/[0.03] border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-5 gap-0 border border-white/10">
            {[
              "Planes de entrenamiento personalizados",
              "Actualización constante según evolución",
              "Seguimiento individual real",
              "Registro completo del proceso",
              "Método basado en experiencia y datos",
            ].map((item, i) => (
              <div key={i} className="border-r border-white/10 last:border-r-0 p-6">
                <div className="text-xs text-gray-500 mb-3">{String(i + 1).padStart(2, "0")}</div>
                <p className="text-sm text-gray-300 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOQUE CONCEPTUAL */}
      <section className="py-32 px-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Construir sobre bases sólidas</h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-6">
            El desarrollo físico no es solo entrenar.<br />
            Es fuerza, movilidad, control y adaptación.
          </p>
          <p className="text-gray-500 text-base">
            Cada plan de entrenamiento responde a una lógica y se ajusta en función del progreso.
          </p>
        </div>
        <div className="max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10">
          {[
            ["Fuerza", "Base del desarrollo físico"],
            ["Movilidad", "Control y rango de movimiento"],
            ["Resistencia", "Capacidad de sostener esfuerzo"],
            ["Composición corporal", "Resultado del proceso"],
          ].map(([title, desc]) => (
            <div key={title} className="bg-black p-8 text-center">
              <div className="text-base font-bold mb-2">{title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MÉTODO */}
      <section id="metodo" className="py-32 px-6 bg-white/[0.03] border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-4">Cómo se trabaja</p>
          <h2 className="text-3xl font-bold mb-16">El método</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                num: "01", title: "Evaluación",
                items: ["Composición corporal (bioimpedancia)", "Movilidad", "Nivel de fuerza", "Historial"],
              },
              {
                num: "02", title: "Planificación",
                items: ["Plan de entrenamiento personalizado", "Selección específica de ejercicios", "Progresión estructurada"],
              },
              {
                num: "03", title: "Seguimiento",
                items: ["Ajustes constantes", "Control de evolución", "Actualización del plan"],
              },
            ].map(({ num, title, items }) => (
              <div key={num}>
                <div className="text-xs text-gray-600 mb-3 font-mono">{num}</div>
                <h3 className="text-xl font-bold mb-5">{title}</h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="text-sm text-gray-400 flex items-start gap-2">
                      <span className="text-gray-600 mt-1">—</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATAFORMA */}
      <section id="plataforma" className="py-32 px-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-4">Seguimiento y sistema</p>
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-3xl font-bold mb-6">Cada alumno tiene acceso a su plataforma de entrenamiento.</h2>
              <p className="text-gray-400 leading-relaxed mb-8">
                Todo el proceso queda organizado y disponible en todo momento. No depende de la memoria: depende de datos.
              </p>
              <a href={APP_URL} className="inline-block border border-white text-white px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-colors">
                Acceder a la plataforma
              </a>
            </div>
            <div className="space-y-0 border border-white/10">
              {[
                "Plan de entrenamiento actualizado",
                "Ejercicios asignados",
                "Cargas utilizadas",
                "Registro de cada sesión",
                "Estudios de bioimpedancia",
                "Evolución en el tiempo",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-white/10 last:border-b-0">
                  <span className="text-xs text-gray-600 font-mono w-4">{i + 1}</span>
                  <span className="text-sm text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <blockquote className="mt-16 border-l-2 border-white pl-6">
            <p className="text-xl text-gray-300 italic">
              "El proceso no queda en la memoria: queda registrado."
            </p>
          </blockquote>
        </div>
      </section>

      {/* ÁREAS */}
      <section className="py-20 px-6 bg-white/[0.03] border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-10">Áreas</p>
          <div className="grid md:grid-cols-3 gap-px bg-white/10">
            {[
              ["Entrenamiento físico", "Fuerza, movilidad y recomposición corporal"],
              ["Deportes de combate", "Brazilian Jiu-Jitsu y preparación específica"],
              ["Salud y movimiento", "Kinesiología, osteopatía y prevención"],
            ].map(([title, desc]) => (
              <div key={title} className="bg-black p-8">
                <h3 className="font-bold mb-2 text-base">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section id="equipo" className="py-32 px-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-10">Equipo</p>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="border border-white/10 p-8">
              <div className="w-12 h-12 bg-white/10 rounded-full mb-6 flex items-center justify-center">
                <Image src="/logos/DI-ICON-SOLO.svg" alt="DI" width={24} height={24} />
              </div>
              <h3 className="text-xl font-bold mb-1">Ariel Rebesberger</h3>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Head Coach — Método y rendimiento</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Más de 30 años de experiencia en entrenamiento.<br />
                Creador del método Desarrollo Integral.
              </p>
            </div>
            <div className="border border-white/10 p-8">
              <div className="w-12 h-12 bg-white/10 rounded-full mb-6 flex items-center justify-center">
                <Image src="/logos/DI-ICON-SOLO.svg" alt="DI" width={24} height={24} />
              </div>
              <h3 className="text-xl font-bold mb-1">Griselda Politino</h3>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Movimiento y salud</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Enfoque en rehabilitación, prevención y control del movimiento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ENTORNO + UBICACIÓN */}
      <section className="py-20 px-6 bg-white/[0.03] border-t border-white/10">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-6">El espacio</p>
            <p className="text-lg text-gray-300 mb-6">Un espacio diseñado para entrenar con foco.</p>
            <ul className="space-y-2">
              {["Equipamiento orientado a rendimiento", "Espacios para fuerza y movilidad", "Ambiente sin distracciones"].map(item => (
                <li key={item} className="text-sm text-gray-500 flex gap-2"><span>—</span>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-6">Ubicación</p>
            <p className="text-3xl font-bold mb-2">Cabildo 450</p>
            <p className="text-gray-500">3er piso · Buenos Aires</p>
          </div>
        </div>
      </section>

      {/* CIERRE */}
      <section className="py-32 px-6 border-t border-white/10 text-center">
        <div className="max-w-2xl mx-auto">
          <Image src="/logos/DI-ICON-OUTLINE.svg" alt="DI" width={64} height={64} className="mx-auto mb-10 opacity-40" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-snug">
            Entrenamiento estructurado.<br />
            Seguimiento real.<br />
            Progreso medible.
          </h2>
          <p className="text-gray-500 mt-8 mb-10 text-base">
            Cada alumno tiene un plan de entrenamiento propio y todo su proceso está medido y registrado.
          </p>
          <a href={APP_URL} className="inline-block bg-white text-black px-12 py-4 text-sm font-bold tracking-widest uppercase hover:bg-gray-100 transition-colors">
            Acceder a la plataforma
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Image src="/logos/DI-TYPEFACE.svg" alt="Desarrollo Integral" width={120} height={20} className="opacity-40" />
          <p className="text-xs text-gray-600">© 2026 Desarrollo Integral · Cabildo 450, 3er piso</p>
        </div>
      </footer>

    </div>
  );
}
