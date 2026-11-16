import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Lato } from "next/font/google";

import "./globals.css";

// magneto365.com sets everything in Lato; 900 carries its headlines.
const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Moon Light · Profile Manager",
  description: "Tu perfil al 100% y vacantes ordenadas por un puntaje que puedes leer.",
  icons: { icon: "/brand/favicon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={lato.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
