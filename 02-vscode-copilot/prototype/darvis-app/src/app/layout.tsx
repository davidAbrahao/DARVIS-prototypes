import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "D.A.R.V.I.S. — Central de Comando",
  description: "Sistema pessoal de inteligência do D.A.R.V.I.S.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
