export default function Contact() {
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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Contacto</h1>

          <form className="space-y-6">
            <div>
              <label className="block text-sm mb-2">Nombre</label>
              <input
                type="text"
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Email</label>
              <input
                type="email"
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Mensaje</label>
              <textarea
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white h-32"
                placeholder="Tu mensaje..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-white text-black py-2 rounded font-bold hover:bg-gray-200"
            >
              Enviar
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500">
        <p>&copy; 2026 Desarrollo Integral. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
