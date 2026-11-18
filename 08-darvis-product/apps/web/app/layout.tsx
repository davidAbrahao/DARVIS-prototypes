import type { Metadata } from "next";
import "./globals.css";

import { AuthProvider } from "./auth-provider";

export const metadata: Metadata = {
  title: "D.A.R.V.I.S. — Cognitive Cockpit",
  description: "Sistema de inteligência pessoal",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
