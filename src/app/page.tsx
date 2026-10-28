"use client";
import dynamic from "next/dynamic";

// O app inteiro roda no cliente: os dados de demonstração vivem no navegador.
const App = dynamic(() => import("@/components/App"), { ssr: false });
export default function Page() { return <App />; }
