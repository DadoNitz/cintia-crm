import { DIA, etapa as etapaInfo, TIPOS, type Campanha, type Config, type EtapaId, type Fluxo, type Lead, type Modelo, type Msg, type Tag, type TipoConsulta } from "./types";

// Dados fictícios para demonstração. Nenhum paciente real.
export const TAGS_PADRAO: Tag[] = [
  { nome: "Paciente antiga", cor: "ouro" },
  { nome: "VIP", cor: "terra" },
  { nome: "Online", cor: "ceu" },
  { nome: "Indicação", cor: "salvia" },
  { nome: "Urgente", cor: "rosa" },
  { nome: "Pediu desconto", cor: "cinza" },
];

export const CONFIG_PADRAO: Config = {
  clinica: "Cintia Machado Clinic",
  telefone: "(51) 99716-9188",
  endereco: "Novo Hamburgo · RS",
  horario: "Segunda a sexta, das 9h às 18h",
  lembreteHoras: 24,
  textoLembrete: "Oi {{nome}}! Passando para lembrar da sua consulta com a Dra. Cintia amanhã às {{hora}}. Podemos confirmar?",
  autoResposta: true,
  textoAuto: "Oi! Recebemos sua mensagem 🤍 Atendemos de segunda a sexta, das 9h às 18h. Assim que abrirmos, a Ana te responde.",
  sugestoesIA: true,
};

export const MODELOS_PADRAO: Modelo[] = [
  { id: "lembrete_consulta", nome: "lembrete_consulta", categoria: "Utilidade", status: "Aprovado", titulo: "Lembrete da sua consulta",
    texto: "Oi {{nome}}! Passando para lembrar da sua consulta com a Dra. Cintia amanhã às {{hora}}. Podemos confirmar?", botao: "Confirmar" },
  { id: "retorno_acompanhamento", nome: "retorno_acompanhamento", categoria: "Utilidade", status: "Aprovado", titulo: "Hora da sua revisão",
    texto: "Oi {{nome}}, já faz um tempo desde seu último acompanhamento com a Dra. Cintia. Que tal agendar sua revisão para seguirmos cuidando da sua saúde?", botao: "Agendar" },
  { id: "novos_horarios", nome: "novos_horarios", categoria: "Marketing", status: "Aprovado", titulo: "Novos horários abertos",
    texto: "Oi {{nome}}! Abrimos novos horários com a Dra. Cintia para {{interesse}} em novembro. Quer que eu reserve um pra você?", botao: "Quero um horário" },
  { id: "reativar_contato", nome: "reativar_contato", categoria: "Marketing", status: "Em análise", titulo: "",
    texto: "Oi {{nome}}, tudo bem? Ficou alguma dúvida sobre a consulta com a Dra. Cintia? Estou por aqui pra te ajudar 🤍" },
  { id: "horario_fim_de_ano", nome: "horario_fim_de_ano", categoria: "Utilidade", status: "Aprovado", titulo: "Horário de fim de ano",
    texto: "Oi {{nome}}! Atendemos até 19/12 e voltamos em 05/01. Pelo WhatsApp seguimos respondendo nos dias úteis." },
];

let n = 0;
const uid = () => `l${Date.now().toString(36)}${(n++).toString(36)}`;
type Conversa = [minAntes: number, de: "p" | "c", texto: string][];

function lead(
  nome: string, tel: string, origem: string, interesse: string, etapa: EtapaId,
  criadoDias: number, movDias: number, tags: string[], conversa: Conversa,
  extra: Partial<Lead> = {},
): Lead {
  const now = Date.now();
  const criado = now - criadoDias * DIA - 3600e3 * 2;
  const mov = now - movDias * DIA - 3600e3;
  const ultima = conversa.length ? Math.min(...conversa.map((c) => c[0])) : 0;
  const msgs: Msg[] = conversa.map(([min, de, texto], i) => ({ id: `${nome}-${i}`, de, texto, t: mov + (ultima - min) * 60e3 }));
  const hist: Lead["hist"] = [{ t: criado, tipo: "criado", texto: `Entrou pelo ${origem}` }];
  if (etapa !== "novo") hist.push({ t: mov, tipo: "etapa", texto: `Movida para ${etapaInfo(etapa).nome}` });
  const ultimaDe = conversa.length ? conversa[conversa.length - 1][1] : "c";
  return {
    id: uid(), nome, tel, email: nome.split(" ")[0].toLowerCase().normalize("NFD").replace(/\p{M}/gu, "") + "@email.com",
    cidade: "Novo Hamburgo", nascimento: "", origem, interesse, etapa, tags, valor: 0,
    criado, mov, consulta: null, modalidade: tags.includes("Online") ? "Online" : "Presencial",
    dra: null, hist, msgs, naoLidas: ultimaDe === "p" && etapa !== "agendado" ? Math.min(conversa.filter((c) => c[1] === "p").length, 2) : 0,
    optin: "sim", responsavel: msgs.length ? "ana" : null, categoria: null, urgente: false, resolvida: false,
    tipo: "Acompanhamento", fluxo: null, chegada: null, confirmada: false, lembrete: null,
    ...extra,
  };
}

const diaUtil = (h: number, m = 0, d = 0) => {
  const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, m, 0, 0);
  while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + (d < 0 ? -1 : 1)); // clínica não abre no fim de semana
  return x.getTime();
};

// Relógio da demo: fora do horário da clínica, o quadro de hoje é montado como se fossem 11h10,
// para quem abrir a demo à noite ainda ver gente na recepção e em consulta.
const INICIO = Date.now();
export function agoraClinica(): number {
  const d = new Date(), h = d.getHours();
  if (h >= 9 && h < 18 && d.getDay() > 0 && d.getDay() < 6) return Date.now();
  const x = new Date(); x.setHours(11, 10, 0, 0); return x.getTime() + (Date.now() - INICIO);
}

function hojeEm(h: number, m: number, nome: string, interesse: string, tipo: TipoConsulta, extra: Partial<Lead> = {}): Lead {
  const inicio = new Date(); inicio.setHours(h, m, 0, 0);
  const t = inicio.getTime(), agora = agoraClinica(), dur = TIPOS[tipo] * 60e3;
  let fluxo: Fluxo = "esperada", chegada: number | null = null;
  if (t + dur <= agora) fluxo = "atendida";
  else if (t <= agora) { fluxo = "consulta"; chegada = t - 9 * 60e3; }
  else if (t - agora <= 35 * 60e3) { fluxo = "recepcao"; chegada = agora - Math.round((35 * 60e3 - (t - agora)) / 3); }
  return lead(nome, `(51) 9${8000 + ((h * 60 + m) * 7) % 1999}-${1000 + ((h * 37 + m) * 13) % 8999}`, "Instagram", interesse, "agendado", 20, 6, [], [], {
    consulta: t, tipo, fluxo, chegada, confirmada: true, lembrete: "confirmado", valor: 0, ...extra,
  });
}

export function seed(): Lead[] {
  const L: Lead[] = [
    lead("Fernanda Rocha", "(51) 99812-4410", "Instagram", "Emagrecimento", "novo", 0, 0, [], [
      [42, "p", "Oi! Vi o reels do emagrecimento inteligente 😍"],
      [41, "p", "Queria saber o valor da consulta com a Dra"],
    ], { responsavel: null, categoria: "Agendamento" }),
    lead("Juliana Kist", "(51) 98455-1032", "Instagram", "Menopausa", "novo", 1, 1, ["Online"], [
      [60, "p", "Boa noite. Estou com muitos calorões e insônia"],
      [58, "p", "A Dra atende online? Moro em Gramado"],
    ], { responsavel: null, categoria: "Dúvida" }),
    lead("Marcos Hoffmann", "(51) 99601-7788", "Site", "Hipertrofia", "novo", 4, 4, [], [
      [10, "p", "Olá, gostaria de agendar uma consulta"],
    ], { categoria: "Agendamento", optin: "pendente" }),
    lead("Patrícia Schmitt", "(51) 99123-6654", "WhatsApp", "Saúde hormonal", "receita", 2, 2, ["Paciente antiga"], [
      [90, "p", "Oi Ana, tudo bem? Minha receita vence semana que vem"],
      [80, "c", "Oi Patrícia! Vou pedir pra Dra renovar e te mando aqui 😊"],
      [5, "p", "Obrigada!!"],
    ], { dra: { texto: "Assinar renovação de receita", feito: false, em: Date.now() - 2 * DIA }, categoria: "Receita" }),
    lead("Luana Becker", "(51) 98877-3020", "WhatsApp", "Modulação intestinal", "receita", 6, 5, ["Paciente antiga"], [
      [30, "p", "Estou sentindo um pouco de estufamento com o probiótico novo"],
      [20, "c", "Vou passar pra Dra avaliar o ajuste da dose, tá?"],
    ], { dra: { texto: "Avaliar ajuste de dose do probiótico", feito: false, em: Date.now() - 5 * DIA }, categoria: "Receita", responsavel: "dra" }),
    lead("Camila Weber", "(51) 99540-2219", "Instagram", "Emagrecimento", "protocolo", 3, 1, [], [
      [120, "p", "Oi! Como funciona o protocolo de 6 meses?"],
      [115, "c", "Oi Camila! É um acompanhamento completo com consulta, exames e ajustes mensais. Posso te mandar os detalhes?"],
      [3, "p", "Pode sim! E aceita cartão?"],
    ], { categoria: "Dúvida" }),
    lead("Renata Lopes", "(51) 99332-8801", "Indicação", "Implante hormonal", "protocolo", 8, 6, ["Indicação"], [
      [200, "p", "Oi, a Márcia me indicou. Queria saber sobre o implante"],
      [190, "c", "Oi Renata! Que bom. Você tem exames recentes?"],
      [180, "p", "Tenho sim, vou mandar aqui"],
    ], { dra: { texto: "Revisar exames enviados", feito: false, em: Date.now() - 6 * DIA }, categoria: "Resultado de exame" }),
    lead("Aline Fischer", "(51) 98201-4475", "Instagram", "Emagrecimento", "retorno", 9, 2, ["Pediu desconto"], [
      [300, "c", "Aline, segue a proposta do protocolo com as formas de pagamento 🤍"],
      [250, "p", "Obrigada! Vou conversar com meu marido e te falo"],
    ], { valor: 4800, categoria: "Agendamento" }),
    lead("Daniela Kunz", "(51) 99764-1190", "Telemedicina", "Hashimoto", "retorno", 12, 7, ["Online"], [
      [400, "c", "Daniela, te enviei a proposta do acompanhamento online. Ficou alguma dúvida?"],
    ], { valor: 3600, categoria: "Agendamento" }),
    lead("Bruna Zimmer", "(51) 98611-5302", "Instagram", "Menopausa", "agendar", 5, 1, ["VIP"], [
      [60, "p", "Decidi fechar! Prefiro sexta à tarde"],
      [50, "c", "Que ótimo, Bruna! Vou ver os horários e te passo"],
    ], { valor: 5200, categoria: "Agendamento" }),
    lead("Tatiane Moura", "(51) 99208-6617", "WhatsApp", "Saúde hormonal", "agendar", 7, 4, [], [
      [100, "c", "Tati, me passa os dias que tu pode que eu encaixo"],
      [96, "p", "Vou ver minha escala e te aviso"],
    ], { valor: 3900, categoria: "Agendamento" }),
    lead("Sabrina Engel", "(51) 98320-7741", "Instagram", "Emagrecimento", "sem", 18, 11, ["Pediu desconto"], [
      [800, "c", "Sabrina, conseguiu ver a proposta?"],
    ], { resolvida: true }),
    lead("Mônica Fritsch", "(51) 99655-4002", "WhatsApp", "Menopausa", "sem", 22, 15, [], [
      [900, "c", "Oi Mônica! Ainda tem interesse na consulta?"],
    ], { optin: "nao", resolvida: true }),
    lead("Roberta Sauer", "(51) 98812-0047", "Instagram", "Emagrecimento", "sem", 45, 40, [], [], { optin: "pendente" }),
    lead("Eduarda Vogt", "(51) 99502-6623", "Site", "Implante hormonal", "protocolo", 2, 0, [], [
      [25, "p", "Bom dia! O implante hormonal dura quanto tempo?"],
    ], { responsavel: null, categoria: "Dúvida" }),
    lead("Noemi Feltes", "(51) 99318-4471", "WhatsApp", "Saúde hormonal", "agendado", 30, 0, ["Paciente antiga"], [
      [8, "p", "Estou com muita dor de cabeça desde que comecei o implante. É normal?"],
    ], { urgente: true, categoria: "Dúvida", responsavel: "dra", consulta: diaUtil(15, 0, 6), tipo: "Retorno de exames" }),

    // Consultas de hoje (quadro de fluxo)
    hojeEm(9, 0, "Priscila Mattos", "Modulação intestinal", "Acompanhamento", { tags: ["Paciente antiga"], origem: "Site", valor: 3200 }),
    hojeEm(9, 40, "Larissa Hahn", "Emagrecimento", "Acompanhamento"),
    hojeEm(10, 20, "Beatriz Koch", "Menopausa", "Primeira consulta", { valor: 5200 }),
    hojeEm(10, 50, "Simone Ritter", "Implante hormonal", "Implante hormonal", { tags: ["Paciente antiga"] }),
    hojeEm(11, 20, "Paula Wagner", "Saúde hormonal", "Acompanhamento"),
    hojeEm(11, 40, "Cristina Lemos", "Longevidade", "Primeira consulta", { tags: ["VIP"], valor: 6200 }),
    hojeEm(13, 30, "Jéssica Arndt", "Hashimoto", "Retorno de exames", { confirmada: false, lembrete: "lido" }),
    hojeEm(14, 30, "Vanessa Reis", "Emagrecimento", "Acompanhamento", { valor: 4800 }),
    hojeEm(15, 30, "Fabiana Klein", "Modulação intestinal", "Primeira consulta", { confirmada: false, lembrete: "enviado", optin: "pendente" }),
    hojeEm(17, 0, "Mariana Duarte", "Menopausa", "Acompanhamento", { modalidade: "Online", tags: ["Online"] }),

    // Amanhã (lembretes)
    lead("Gabriela Klein", "(51) 99415-3378", "Instagram", "Emagrecimento", "agendado", 10, 3, [], [
      [60, "c", "Consulta marcada para amanhã às 14h ✨"],
      [55, "p", "Perfeito, obrigada!"],
    ], { consulta: diaUtil(14, 0, 1), valor: 4800, tipo: "Primeira consulta" }),
    lead("Rafaela Gomes", "(51) 98720-1188", "Indicação", "Saúde hormonal", "agendado", 8, 2, ["Indicação"], [], { consulta: diaUtil(9, 0, 1), tipo: "Primeira consulta" }),
    lead("Débora Silveira", "(51) 99054-7720", "Instagram", "Emagrecimento", "agendado", 15, 4, [], [], { consulta: diaUtil(10, 0, 1) }),
    lead("Kátia Moraes", "(51) 99611-3054", "Site", "Hashimoto", "agendado", 11, 3, [], [], { consulta: diaUtil(15, 30, 1), tipo: "Retorno de exames" }),
    lead("Lúcia Prates", "(51) 98432-9901", "WhatsApp", "Menopausa", "agendado", 9, 5, [], [], { consulta: diaUtil(16, 30, 1), optin: "pendente" }),

    // Próximos dias
    lead("Carla Dietrich", "(51) 98733-0921", "Indicação", "Saúde hormonal", "agendado", 14, 8, ["Indicação", "Online"], [
      [30, "c", "Carla, seu link da consulta online chega 1h antes 🤍"],
    ], { consulta: diaUtil(10, 30, 2), modalidade: "Online", valor: 3900 }),
    lead("Isadora Meyer", "(51) 99231-5508", "Instagram", "Longevidade", "agendado", 6, 2, ["VIP"], [
      [15, "c", "Isadora, sua consulta com a Dra. Cintia está marcada para as 11h ✨"],
    ], { consulta: diaUtil(11, 0, 3), valor: 6200, tipo: "Primeira consulta" }),
    lead("Helena Pires", "(51) 98144-7790", "Indicação", "Saúde hormonal", "agendado", 16, 9, ["Indicação"], [], { consulta: diaUtil(14, 30, 4), valor: 3900 }),
    lead("Letícia Brandt", "(51) 99081-3366", "Instagram", "Hipertrofia", "agendado", 40, 35, [], [], { consulta: diaUtil(15, 0, -20), valor: 3500 }),
  ];
  return L;
}

export function seedCampanhas(): Campanha[] {
  const em = (d: number, h = 9) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x.getTime(); };
  return [
    { id: "c1", nome: "Revisão de acompanhamento · novembro", modelo: "retorno_acompanhamento", publico: { etapas: [], tags: ["Paciente antiga"], interesses: [] },
      status: "agendada", quando: em(3), enviadaEm: null, metricas: null },
    { id: "c2", nome: "Reativar quem parou de responder", modelo: "reativar_contato", publico: { etapas: ["sem", "retorno"], tags: [], interesses: [] },
      status: "rascunho", quando: null, enviadaEm: null, metricas: null },
    { id: "c3", nome: "Horário de fim de ano", modelo: "horario_fim_de_ano", publico: { etapas: [], tags: [], interesses: [] },
      status: "rascunho", quando: null, enviadaEm: null, metricas: null },
    { id: "c4", nome: "Novos horários · Emagrecimento", modelo: "novos_horarios", publico: { etapas: [], tags: [], interesses: ["Emagrecimento"] },
      status: "enviada", quando: em(-12, 10), enviadaEm: em(-12, 10), metricas: { enviadas: 142, entregues: 139, lidas: 121, respondidas: 44, agendadas: 17 } },
    { id: "c5", nome: "Menopausa · conteúdo da live", modelo: "novos_horarios", publico: { etapas: [], tags: [], interesses: ["Menopausa"] },
      status: "enviada", quando: em(-26, 18), enviadaEm: em(-26, 18), metricas: { enviadas: 96, entregues: 95, lidas: 88, respondidas: 31, agendadas: 12 } },
  ];
}

