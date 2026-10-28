import { DIA, FRIO, type Lead } from "./types";

export const dias = (t: number) => Math.floor((Date.now() - t) / DIA);
export const quando = (t: number) => {
  const d = dias(t);
  return d <= 0 ? "hoje" : d === 1 ? "ontem" : `há ${d} dias`;
};
export const hora = (t: number) => new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
export const data = (t: number) => new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
export const dataLonga = (t: number) =>
  new Date(t).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
export const quandoMsg = (t: number) => (dias(t) <= 0 && new Date(t).getDate() === new Date().getDate() ? hora(t) : data(t));
export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const iniciais = (nome: string) => nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
export const parado = (l: Lead) => !["agendado", "sem"].includes(l.etapa) && dias(l.mov) > FRIO;
export const ultimaMsg = (l: Lead) => l.msgs[l.msgs.length - 1];
export const aguardandoClinica = (l: Lead) => ultimaMsg(l)?.de === "p";

// Tons do avatar derivados do nome: sempre o mesmo para a mesma paciente.
const TONS = ["ouro", "rosa", "salvia", "ceu", "terra"];
export const tom = (nome: string) => TONS[[...nome].reduce((a, c) => a + c.charCodeAt(0), 0) % TONS.length];
