import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "D.A.R.V.I.S. — Cognitive Cockpit",
  description: "Personal intelligence system",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
