import { DIA, etapa as etapaInfo, type EtapaId, type Lead, type Msg, type Tag } from "./types";

// Dados fictícios para demonstração. Nenhum paciente real.
export const TAGS_PADRAO: Tag[] = [
  { nome: "Paciente antiga", cor: "ouro" },
  { nome: "VIP", cor: "terra" },
  { nome: "Online", cor: "ceu" },
  { nome: "Indicação", cor: "salvia" },
  { nome: "Urgente", cor: "rosa" },
  { nome: "Pediu desconto", cor: "cinza" },
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
  const msgs: Msg[] = conversa.map(([min, de, texto], i) => ({
    id: `${nome}-${i}`, de, texto, t: mov + (ultima - min) * 60e3,
  }));
  const hist: Lead["hist"] = [{ t: criado, tipo: "criado", texto: `Entrou pelo ${origem}` }];
  if (etapa !== "novo") hist.push({ t: mov, tipo: "etapa", texto: `Movida para ${etapaInfo(etapa).nome}` });
  const ultimaDe = conversa.length ? conversa[conversa.length - 1][1] : "c";
  return {
    id: uid(), nome, tel, email: nome.split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") + "@email.com",
    cidade: "Novo Hamburgo", nascimento: "", origem, interesse, etapa, tags, valor: 0,
    criado, mov, consulta: null, modalidade: tags.includes("Online") ? "Online" : "Presencial",
    dra: null, hist, msgs, naoLidas: ultimaDe === "p" && etapa !== "agendado" ? Math.min(conversa.filter((c) => c[1] === "p").length, 2) : 0,
    ...extra,
  };
}

const hoje = (h: number, m = 0, d = 0) => {
  const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, m, 0, 0);
  while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + (d < 0 ? -1 : 1)); // clínica não abre no fim de semana
  return x.getTime();
};

export function seed(): Lead[] {
  const L: Lead[] = [
    lead("Fernanda Rocha", "(51) 99812-4410", "Instagram", "Emagrecimento", "novo", 0, 0, [], [
      [42, "p", "Oi! Vi o reels do emagrecimento inteligente 😍"],
      [41, "p", "Queria saber o valor da consulta com a Dra"],
    ]),
    lead("Juliana Kist", "(51) 98455-1032", "Instagram", "Menopausa", "novo", 1, 1, ["Online"], [
      [60, "p", "Boa noite. Estou com muitos calorões e insônia"],
      [58, "p", "A Dra atende online? Moro em Gramado"],
    ]),
    lead("Marcos Hoffmann", "(51) 99601-7788", "Site", "Hipertrofia", "novo", 4, 4, [], [
      [10, "p", "Olá, gostaria de agendar uma consulta"],
    ]),
    lead("Patrícia Schmitt", "(51) 99123-6654", "WhatsApp", "Saúde hormonal", "receita", 2, 2, ["Paciente antiga"], [
      [90, "p", "Oi Ana, tudo bem? Minha receita vence semana que vem"],
      [80, "c", "Oi Patrícia! Vou pedir pra Dra renovar e te mando aqui 😊"],
      [5, "p", "Obrigada!!"],
    ], { dra: { texto: "Assinar renovação de receita", feito: false, em: Date.now() - 2 * DIA } }),
    lead("Luana Becker", "(51) 98877-3020", "WhatsApp", "Modulação intestinal", "receita", 6, 5, ["Paciente antiga"], [
      [30, "p", "Estou sentindo um pouco de estufamento com o probiótico novo"],
      [20, "c", "Vou passar pra Dra avaliar o ajuste da dose, tá?"],
    ], { dra: { texto: "Avaliar ajuste de dose do probiótico", feito: false, em: Date.now() - 5 * DIA } }),
    lead("Camila Weber", "(51) 99540-2219", "Instagram", "Emagrecimento", "protocolo", 3, 1, [], [
      [120, "p", "Oi! Como funciona o protocolo de 6 meses?"],
      [115, "c", "Oi Camila! É um acompanhamento completo com consulta, exames e ajustes mensais. Posso te mandar os detalhes?"],
      [3, "p", "Pode sim! E aceita cartão?"],
    ]),
    lead("Renata Lopes", "(51) 99332-8801", "Indicação", "Implante hormonal", "protocolo", 8, 6, ["Indicação"], [
      [200, "p", "Oi, a Márcia me indicou. Queria saber sobre o implante"],
      [190, "c", "Oi Renata! Que bom. Você tem exames recentes?"],
      [180, "p", "Tenho sim, vou mandar aqui"],
    ], { dra: { texto: "Revisar exames enviados", feito: false, em: Date.now() - 6 * DIA } }),
    lead("Aline Fischer", "(51) 98201-4475", "Instagram", "Emagrecimento", "retorno", 9, 2, ["Pediu desconto"], [
      [300, "c", "Aline, segue a proposta do protocolo com as formas de pagamento 🤍"],
      [250, "p", "Obrigada! Vou conversar com meu marido e te falo"],
    ], { valor: 4800 }),
    lead("Daniela Kunz", "(51) 99764-1190", "Telemedicina", "Hashimoto", "retorno", 12, 7, ["Online"], [
      [400, "c", "Daniela, te enviei a proposta do acompanhamento online. Ficou alguma dúvida?"],
    ], { valor: 3600 }),
    lead("Bruna Zimmer", "(51) 98611-5302", "Instagram", "Menopausa", "agendar", 5, 1, ["VIP"], [
      [60, "p", "Decidi fechar! Prefiro sexta à tarde"],
      [50, "c", "Que ótimo, Bruna! Vou ver os horários e te passo"],
    ], { valor: 5200 }),
    lead("Tatiane Moura", "(51) 99208-6617", "WhatsApp", "Saúde hormonal", "agendar", 7, 4, [], [
      [100, "c", "Tati, me passa os dias que tu pode que eu encaixo"],
      [96, "p", "Vou ver minha escala e te aviso"],
    ], { valor: 3900 }),
    lead("Gabriela Klein", "(51) 99415-3378", "Instagram", "Emagrecimento", "agendado", 10, 3, [], [
      [60, "c", "Consulta confirmada para terça às 14h ✨"],
      [55, "p", "Perfeito, obrigada!"],
    ], { consulta: hoje(14, 0, 1), valor: 4800 }),
    lead("Carla Dietrich", "(51) 98733-0921", "Indicação", "Saúde hormonal", "agendado", 14, 8, ["Indicação", "Online"], [
      [30, "c", "Carla, seu link da consulta online chega 1h antes 🤍"],
    ], { consulta: hoje(10, 30, 2), modalidade: "Online", valor: 3900 }),
    lead("Priscila Mattos", "(51) 99877-2264", "Site", "Modulação intestinal", "agendado", 20, 12, ["Paciente antiga"], [
      [20, "p", "Confirmado! Até lá"],
    ], { consulta: hoje(9, 0, 0), valor: 3200 }),
    lead("Vanessa Reis", "(51) 99102-8853", "Instagram", "Emagrecimento", "agendado", 25, 18, [], [], { consulta: hoje(16, 0, 0), valor: 4800 }),
    lead("Isadora Meyer", "(51) 99231-5508", "Instagram", "Longevidade", "agendado", 6, 2, ["VIP"], [
      [15, "c", "Isadora, tudo certo para quinta às 11h"],
    ], { consulta: hoje(11, 0, 3), valor: 6200 }),
    lead("Sabrina Engel", "(51) 98320-7741", "Instagram", "Emagrecimento", "sem", 18, 11, ["Pediu desconto"], [
      [800, "c", "Sabrina, conseguiu ver a proposta?"],
    ]),
    lead("Mônica Fritsch", "(51) 99655-4002", "WhatsApp", "Menopausa", "sem", 22, 15, [], [
      [900, "c", "Oi Mônica! Ainda tem interesse na consulta?"],
    ]),
    lead("Letícia Brandt", "(51) 99081-3366", "Instagram", "Hipertrofia", "agendado", 40, 35, [], [], { consulta: hoje(15, 0, -20), valor: 3500 }),
    lead("Roberta Sauer", "(51) 98812-0047", "Instagram", "Emagrecimento", "sem", 45, 40, [], []),
    lead("Eduarda Vogt", "(51) 99502-6623", "Site", "Implante hormonal", "protocolo", 2, 0, [], [
      [25, "p", "Bom dia! O implante hormonal dura quanto tempo?"],
    ]),
    lead("Helena Pires", "(51) 98144-7790", "Indicação", "Saúde hormonal", "agendado", 16, 9, ["Indicação"], [], { consulta: hoje(14, 30, 4), valor: 3900 }),
  ];
  return L;
}
