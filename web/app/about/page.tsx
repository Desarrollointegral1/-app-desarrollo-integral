export default function About() {
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

      <section className="flex-1 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Sobre Desarrollo Integral</h1>
          <div className="space-y-6 text-gray-300">
            <p>
              Somos un centro de entrenamiento dedicado a ayudarte a alcanzar tus objetivos de fitness.
            </p>
            <p>
              Contamos con planes personalizados diseñados por profesionales, videos demostrativos de cada ejercicio,
              y herramientas para registrar tu progreso día a día.
            </p>
            <p>
              Nuestro objetivo es que tengas todo lo que necesitas para entrenar de forma segura y efectiva.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500">
        <p>&copy; 2026 Desarrollo Integral. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
