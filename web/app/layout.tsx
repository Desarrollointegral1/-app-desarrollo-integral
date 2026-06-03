import type { Metadata } from "next";
import { initializeBrainFactory } from "@/lib/brain-factory";
import "./globals.css";

// Inicializar Brain Factory (solo en servidor)
if (process.env.NODE_ENV === "development") {
  initializeBrainFactory().catch(console.error);
}

export const metadata: Metadata = {
  title: "Desarrollo Integral — Centro de Entrenamiento",
  description: "Planes de entrenamiento personalizados, con seguimiento y registro completo de cada proceso.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
