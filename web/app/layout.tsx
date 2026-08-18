import type { Metadata } from "next";
import { initializeBrainFactory } from "@/lib/brain-factory";
import "./globals.css";

// Inicializar Brain Factory (solo en servidor)
if (process.env.NODE_ENV === "development") {
  initializeBrainFactory().catch(console.error);
}

export const metadata: Metadata = {
  title: "Desarrollo Integral | Entrenamiento Personalizado en Belgrano, Buenos Aires",
  description:
    "Centro de entrenamiento personalizado en Belgrano. Evaluación con bioimpedancia, plan de entrenamiento propio y seguimiento profesional sesión a sesión. Av. Cabildo 450, Buenos Aires.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* La fuente del H1 (LCP) se descubre desde el HTML, no recién desde el CSS */}
        <link
          rel="preload"
          href="/web/fonts/pp-formula/PPFormula-SemiExtendedBold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Aplica el tema persistido antes del primer paint (evita flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('di-theme')==='light'){document.documentElement.setAttribute('data-theme','light')}}catch(e){}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
