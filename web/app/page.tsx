export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="font-bold text-xl">Desarrollo Integral</div>
          <div className="flex gap-6">
            <a href="/" className="hover:text-gray-300">Inicio</a>
            <a href="/about" className="hover:text-gray-300">Nosotros</a>
            <a href="/contact" className="hover:text-gray-300">Contacto</a>
          </div>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <img src="/logos/DI - ICON - SOLO.png" alt="DI" className="w-48 h-48 mb-8" />
        <h1 className="text-5xl font-bold mb-4">Desarrollo Integral</h1>
        <p className="text-gray-400 text-xl mb-8">Centro de entrenamiento personalizado</p>
        <a
          href="http://localhost:5173"
          className="bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-200"
        >
          Entrar a la app
        </a>
      </section>

      <section className="py-16 px-6 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Qué ofrecemos</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="font-bold mb-2 text-lg">Planes personalizados</h3>
              <p className="text-gray-400">Rutinas diseñadas para tus objetivos</p>
            </div>
            <div className="text-center">
              <h3 className="font-bold mb-2 text-lg">Videos de ejercicios</h3>
              <p className="text-gray-400">Técnica correcta en cada movimiento</p>
            </div>
            <div className="text-center">
              <h3 className="font-bold mb-2 text-lg">Seguimiento en tiempo real</h3>
              <p className="text-gray-400">Registra tu progreso día a día</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500">
        <p>&copy; 2026 Desarrollo Integral. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
