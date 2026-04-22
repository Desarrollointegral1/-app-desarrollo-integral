import type { Metadata } from "next";
import "./globals.css";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
