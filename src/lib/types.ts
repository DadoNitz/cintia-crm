export type EtapaId = "novo" | "receita" | "protocolo" | "retorno" | "agendar" | "agendado" | "sem";

export type Etapa = { id: EtapaId; nome: string; curto: string; hint: string; cor: string };

export const ETAPAS: Etapa[] = [
  { id: "novo", nome: "Primeiro contato", curto: "Novo", hint: "Chegou agora, ainda sem resposta", cor: "var(--st-novo)" },
  { id: "receita", nome: "Pediu receita", curto: "Receita", hint: "Renovação ou ajuste de receita", cor: "var(--st-receita)" },
  { id: "protocolo", nome: "Pediu protocolo", curto: "Protocolo", hint: "Quer valores e como funciona", cor: "var(--st-protocolo)" },
  { id: "retorno", nome: "Aguardando retorno", curto: "Decidindo", hint: "Recebeu a proposta, vai decidir", cor: "var(--st-retorno)" },
  { id: "agendar", nome: "Aguardando agendar", curto: "Agendar", hint: "Fechou, falta marcar a data", cor: "var(--st-agendar)" },
  { id: "agendado", nome: "Agendado", curto: "Agendado", hint: "Consulta marcada", cor: "var(--st-agendado)" },
  { id: "sem", nome: "Sem retorno", curto: "Sem retorno", hint: "Parou de responder", cor: "var(--st-sem)" },
];
export const etapa = (id: EtapaId) => ETAPAS.find((e) => e.id === id)!;

export const ORIGENS = ["Instagram", "WhatsApp", "Site", "Indicação", "Telemedicina"] as const;
export const INTERESSES = [
  "Emagrecimento", "Menopausa", "Saúde hormonal", "Implante hormonal",
  "Modulação intestinal", "Hashimoto", "Hipertrofia", "Longevidade",
] as const;

export type Tag = { nome: string; cor: TagCor };
export type TagCor = "ouro" | "rosa" | "salvia" | "ceu" | "terra" | "cinza";
export const TAG_CORES: TagCor[] = ["ouro", "rosa", "salvia", "ceu", "terra", "cinza"];

export type Msg = { id: string; t: number; de: "p" | "c"; texto: string };
export type Evento = { t: number; tipo: "criado" | "etapa" | "nota" | "tag" | "dra" | "consulta"; texto: string };
export type Pendencia = { texto: string; feito: boolean; em: number };

export type Lead = {
  id: string;
  nome: string;
  tel: string;
  email: string;
  cidade: string;
  nascimento: string;
  origem: string;
  interesse: string;
  etapa: EtapaId;
  tags: string[];
  valor: number;
  criado: number;
  mov: number;
  consulta: number | null;
  modalidade: "Presencial" | "Online";
  dra: Pendencia | null;
  hist: Evento[];
  msgs: Msg[];
  naoLidas: number;
};

export const DIA = 864e5;
export const FRIO = 3; // dias parado até o card ficar marcado
