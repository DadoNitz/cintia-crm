import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const jost = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--f-jost" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--f-cormorant" });

export const metadata: Metadata = {
  title: "Cintia Machado Clinic · CRM",
  description: "Funil de pacientes, conversas e pendências da Cintia Machado Clinic.",
  robots: { index: false, follow: false },
  applicationName: "Cintia CRM",
  appleWebApp: { capable: true, title: "Cintia CRM", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#D1C9B6" }, { media: "(prefers-color-scheme: dark)", color: "#2A2622" }],
};

// Aplica o tema salvo antes da primeira pintura, sem piscar.
const temaInicial = `try{var t=localStorage.getItem('cmc-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${jost.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: temaInicial }} /></head>
      <body>{children}</body>
    </html>
  );
}
