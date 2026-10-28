"use client";
import dynamic from "next/dynamic";
import { Loader } from "@/components/Loader";

// O app inteiro roda no cliente: os dados de demonstração vivem no navegador.
const App = dynamic(() => import("@/components/App"), { ssr: false, loading: () => <Loader /> });
export default function Page() { return <App />; }
