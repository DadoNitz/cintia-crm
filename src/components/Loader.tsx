import { LogoMarca, LogoTexto } from "@/components/Logo";

// Tela de carregamento. Vem no HTML do servidor (fallback do import dinâmico), então aparece antes do JavaScript.
// "continua": versão que o App mostra por cima ao montar, sem repetir a entrada para não dar um "pulo".
export function Loader({ continua = false }: { continua?: boolean }) {
  return (
    <div className={`loader ${continua ? "loader-continua" : ""}`} role="status" aria-label="Carregando o CRM">
      <div className="loader-marca"><LogoMarca size={88} /></div>
      <LogoTexto width={220} className="loader-texto" />
      <div className="loader-barra"><span /></div>
    </div>
  );
}
