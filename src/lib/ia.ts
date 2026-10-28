import type { EtapaId, Lead } from "./types";

export type Sugestao = { rotulo: string; texto: string };
export type Resultado = { sugestoes: Sugestao[]; etapa: EtapaId | null; motivo: string | null; fonte: "ia" | "local"; aviso?: string };

const primeiro = (nome: string) => nome.split(" ")[0] || "";
const tem = (t: string, ...p: string[]) => p.some((x) => t.includes(x));

type Contexto = Pick<Lead, "nome" | "msgs" | "etapa"> & Partial<Pick<Lead, "consulta" | "modalidade" | "interesse" | "dra" | "confirmada">>;

const quandoConsulta = (t: number) => {
  const d = new Date(t), hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const dif = Math.round((new Date(d).setHours(0, 0, 0, 0) - hoje.getTime()) / 864e5);
  const h = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }).replace(":00", "h");
  const dia = dif === 0 ? "hoje" : dif === 1 ? "amanhã" : d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  return `${dia} às ${h}`;
};

// O que faz sentido dizer em cada etapa quando a clínica precisa puxar ou continuar a conversa.
function porEtapa(l: Contexto, n: string, agora: number): Sugestao[] {
  const futura = l.consulta && l.consulta > agora;
  if (l.etapa === "agendado" && futura) {
    const q = quandoConsulta(l.consulta!);
    return [
      l.confirmada
        ? { rotulo: "Lembrar a consulta", texto: `Oi ${n}! Tudo certo para ${q} com a Dra. Cintia. Qualquer imprevisto, me avisa por aqui 🤍` }
        : { rotulo: "Confirmar presença", texto: `Oi ${n}! Passando para confirmar sua consulta com a Dra. Cintia ${q}. Posso confirmar?` },
      l.modalidade === "Online"
        ? { rotulo: "Link da consulta", texto: `${n}, sua consulta é online: o link chega aqui [1 hora antes]. Se puder, fique num lugar tranquilo e com boa internet.` }
        : { rotulo: "Endereço", texto: `${n}, te esperamos ${q} em [endereço]. Chegue uns 10 minutinhos antes, tá?` },
      { rotulo: "Pedir exames", texto: `${n}, se tiver exames recentes, pode me mandar por aqui antes da consulta? Assim a Dra. Cintia já chega olhando tudo.` },
      { rotulo: "Se precisar remarcar", texto: `${n}, se precisar remarcar, me avisa com antecedência que eu encaixo em outro horário.` },
    ];
  }
  if (l.etapa === "agendado") return [
    { rotulo: "Pós-consulta", texto: `Oi ${n}! Como você está se sentindo depois da consulta com a Dra. Cintia?` },
    { rotulo: "Dúvidas do protocolo", texto: `${n}, durante o tratamento a Dra. Cintia fica disponível para dúvidas sobre o protocolo. Qualquer coisa, me chama aqui.` },
    { rotulo: "Marcar acompanhamento", texto: `${n}, já quer deixar o acompanhamento marcado? Tenho [dia] às [hora] ou [dia] às [hora].` },
  ];
  if (l.etapa === "novo") return [
    { rotulo: "Boas-vindas", texto: `Oi ${n}, que bom ter você por aqui! Sou da recepção da Dra. Cintia Machado. Como posso te ajudar?` },
    { rotulo: "Entender o objetivo", texto: `${n}, me conta um pouquinho: o que te fez procurar a Dra. Cintia${l.interesse ? ` sobre ${l.interesse.toLowerCase()}` : ""}? Assim te explico como funciona.` },
    { rotulo: "Como é a consulta", texto: `${n}, na consulta a Dra. Cintia tem tempo para entender seu histórico, rotina e objetivos, e monta um tratamento individualizado pra você.` },
    { rotulo: "Oferecer horários", texto: `${n}, tenho horários [dia] às [hora] ou [dia] às [hora], presencial ou online. Algum fica bom?` },
  ];
  if (l.etapa === "receita") return [
    { rotulo: "Receita em andamento", texto: `${n}, já pedi para a Dra. Cintia e assim que ela assinar te envio aqui.` },
    { rotulo: "Receita pronta", texto: `${n}, sua receita está pronta! Segue aqui [anexar receita]. Qualquer dúvida, me chama.` },
    { rotulo: "Precisa de consulta", texto: `${n}, para renovar essa receita a Dra. Cintia precisa te ver de novo. Quer que eu veja um horário?` },
  ];
  if (l.etapa === "protocolo") return [
    { rotulo: "Explicar o protocolo", texto: `${n}, o protocolo${l.interesse ? ` de ${l.interesse.toLowerCase()}` : ""} começa com a consulta e os exames, e depois tem acompanhamento e ajustes durante o tratamento. Quer que eu te mande os detalhes?` },
    { rotulo: "Enviar proposta", texto: `${n}, segue a proposta: [valor do protocolo], com [formas de pagamento]. Se fizer sentido, já reservo seu horário.` },
    { rotulo: "Tirar dúvida", texto: `${n}, ficou alguma dúvida sobre o protocolo? Posso perguntar para a Dra. Cintia se precisar.` },
  ];
  if (l.etapa === "retorno") return [
    { rotulo: "Retomar com cuidado", texto: `Oi ${n}, tudo bem? Conseguiu pensar sobre o acompanhamento? Se ficou alguma dúvida, estou por aqui 🤍` },
    { rotulo: "Novos horários", texto: `${n}, abriram horários para [mês] com a Dra. Cintia. Quer que eu reserve um pra você?` },
    { rotulo: "Dúvida com a Dra", texto: `${n}, se quiser, levo sua dúvida direto para a Dra. Cintia antes de você decidir.` },
  ];
  if (l.etapa === "agendar") return [
    { rotulo: "Oferecer horários", texto: `${n}, tenho [dia] às [hora] ou [dia] às [hora]. Qual fica melhor pra você?` },
    { rotulo: "Pedir disponibilidade", texto: `${n}, me passa os dias e períodos que ficam melhores pra você que eu encaixo com a Dra. Cintia.` },
  ];
  return [
    { rotulo: "Reativar contato", texto: `Oi ${n}, tudo bem? Passando para saber se ainda posso te ajudar com a consulta da Dra. Cintia 🤍` },
    { rotulo: "Novidade", texto: `${n}, abrimos novos horários com a Dra. Cintia. Se ainda tiver interesse, é só me falar que reservo um pra você.` },
  ];
}

// Sugestões sem IA: usadas quando a chave não está configurada ou o provedor falha.
// Olha quem falou por último, há quanto tempo, a etapa do funil, a consulta marcada e as palavras da última mensagem da paciente.
export function sugestoesLocais(l: Contexto, agora = Date.now()): Resultado {
  const n = primeiro(l.nome);
  const ultimaMsg = l.msgs[l.msgs.length - 1];
  const pacienteFalou = ultimaMsg?.de === "p";
  const ultima = pacienteFalou ? ultimaMsg.texto.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "") : "";
  const s: Sugestao[] = [];
  let etapa: EtapaId | null = null;

  if (pacienteFalou) {
    if (tem(ultima, "dor forte", "falta de ar", "sangr", "desmai", "febre", "peito", "urgente")) {
      s.push({ rotulo: "Orientar urgência", texto: `${n}, pelo que você descreveu, o mais seguro é procurar um pronto-atendimento agora ou ligar 192 (SAMU). Já estou avisando a Dra. Cintia.` });
    }
    if (tem(ultima, "dor", "normal", "efeito", "sintoma", "estufa", "enjoo", "inchad", "tontura")) {
      s.push({ rotulo: "Passar para a Dra", texto: `Oi ${n}! Obrigada por avisar. Vou passar agora para a Dra. Cintia avaliar e te retorno aqui ainda hoje 🤍` });
    }
    if (tem(ultima, "valor", "preco", "quanto", "custa", "cartao", "pagamento", "parcel", "pix")) {
      s.push({ rotulo: "Enviar valores", texto: `Oi ${n}! A consulta com a Dra. Cintia é [valor], e aceitamos [formas de pagamento]. Quer que eu veja os horários livres desta semana?` });
      if (l.etapa === "novo") etapa = "protocolo";
    }
    if (tem(ultima, "online", "distancia", "moro em", "outra cidade", "video")) {
      s.push({ rotulo: "Consulta online", texto: `Atende sim, ${n}! A consulta pode ser online, com a mesma estrutura da presencial. Posso te passar os horários?` });
    }
    if (tem(ultima, "convenio", "plano de saude", "unimed", "reembolso")) {
      s.push({ rotulo: "Convênio", texto: `${n}, o atendimento da Dra. Cintia é particular, mas os exames que ela pedir podem ser feitos pelo seu convênio.` });
    }
    if (tem(ultima, "receita", "renov")) {
      s.push({ rotulo: "Receita", texto: `Oi ${n}! Vou pedir para a Dra. Cintia renovar sua receita e te envio por aqui assim que estiver pronta.` });
      if (l.etapa === "novo") etapa = "receita";
    }
    if (tem(ultima, "exame", "resultado")) {
      s.push({ rotulo: "Exames", texto: `Recebi, ${n}! Vou encaminhar seus exames para a Dra. Cintia avaliar e te dou retorno por aqui.` });
    }
    if (tem(ultima, "remarcar", "desmarcar", "nao vou conseguir", "imprevisto", "cancelar")) {
      s.push({ rotulo: "Remarcar", texto: `Sem problema, ${n}! Tenho [dia] às [hora] ou [dia] às [hora]. Qual fica melhor?` });
    }
    if (tem(ultima, "agendar", "marcar", "horario", "decidi", "fechar", "vamos")) {
      s.push({ rotulo: "Oferecer horários", texto: `Que bom, ${n}! Tenho [dia] às [hora] ou [dia] às [hora]. Qual fica melhor pra você?` });
      if (["novo", "protocolo", "retorno"].includes(l.etapa)) etapa = "agendar";
    }
    if (tem(ultima, "obrigad", "perfeito", "combinado", "confirmad", "ok", "certo")) {
      s.push({ rotulo: "Encerrar com carinho", texto: `Imagina, ${n}! Qualquer coisa, estou por aqui 🤍` });
    }
    if (!s.length) s.push({ rotulo: "Acolher", texto: `Oi ${n}, tudo bem? Obrigada pela mensagem! Me conta um pouquinho mais pra eu te ajudar da melhor forma.` });
  } else if (ultimaMsg) {
    const dias = Math.floor((agora - ultimaMsg.t) / 864e5);
    if (dias >= 2) s.push({ rotulo: "Retomar conversa", texto: `Oi ${n}, tudo bem? Só passando para saber se posso te ajudar com mais alguma coisa 🤍` });
  }

  if (l.dra && !l.dra.feito) s.push({ rotulo: "Atualizar sobre a Dra", texto: `${n}, já passei para a Dra. Cintia e assim que ela responder te aviso por aqui.` });
  s.push(...porEtapa(l, n, agora));

  const unicas = s.filter((x, i) => s.findIndex((y) => y.rotulo === x.rotulo) === i).slice(0, 4);
  return { sugestoes: unicas, etapa, motivo: etapa ? "Pela última mensagem da paciente" : null, fonte: "local" };
}

export async function pedirSugestoes(l: Lead): Promise<Resultado> {
  try {
    const r = await fetch("/api/sugestoes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paciente: {
          nome: l.nome, interesse: l.interesse, etapa: l.etapa, tags: l.tags,
          consulta: l.consulta ? `${quandoConsulta(l.consulta)}${l.consulta < Date.now() ? " (já passou)" : ""}, ${l.modalidade.toLowerCase()}, ${l.confirmada ? "confirmada" : "não confirmada"}` : null,
          pendenciaDra: l.dra && !l.dra.feito ? l.dra.texto : null,
          hoje: new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }),
        },
        msgs: l.msgs.slice(-12).map(({ de, texto, t }) => ({ de, texto, quando: new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) })),
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const aviso = j.erro === "sem-chave" ? "IA não configurada" : j.erro === "limite" ? "limite da IA atingido, tente em 1 min" : j.erro === "chave" ? "chave da IA inválida" : "IA fora do ar agora";
      return { ...sugestoesLocais(l), aviso };
    }
    return { sugestoes: j.sugestoes, etapa: j.etapa ?? null, motivo: j.motivo ?? null, fonte: "ia" };
  } catch {
    return { ...sugestoesLocais(l), aviso: "sem conexão" };
  }
}
