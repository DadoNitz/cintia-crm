import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Cintia Machado Clinic · CRM",
    short_name: "Cintia CRM",
    description: "Funil de pacientes, conversas do WhatsApp, agenda e campanhas da Cintia Machado Clinic.",
    lang: "pt-BR",
    start_url: "/#painel",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F6F3",
    theme_color: "#D1C9B6",
    categories: ["medical", "business", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Conversas", url: "/#conversas", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Agenda", url: "/#agenda", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Funil", url: "/#funil", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
