import type { EtapaId, Lead } from "./types";

export type Sugestao = { rotulo: string; texto: string };
export type Resultado = { sugestoes: Sugestao[]; etapa: EtapaId | null; motivo: string | null; fonte: "ia" | "local" };

const primeiro = (nome: string) => nome.split(" ")[0] || "";
const tem = (t: string, ...p: string[]) => p.some((x) => t.includes(x));

// Sugestões sem IA: usadas quando a chave não está configurada ou o provedor falha.
// Lê a última mensagem da paciente e escolhe respostas pelas palavras que aparecem.
export function sugestoesLocais(l: Pick<Lead, "nome" | "msgs" | "etapa">): Resultado {
  const n = primeiro(l.nome);
  const ultima = [...l.msgs].reverse().find((m) => m.de === "p")?.texto.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "") ?? "";
  const s: Sugestao[] = [];
  let etapa: EtapaId | null = null;

  if (tem(ultima, "dor forte", "falta de ar", "sangr", "desmai", "febre", "peito", "urgente")) {
    s.push({ rotulo: "Orientar urgência", texto: `${n}, pelo que você descreveu, o mais seguro é procurar um pronto-atendimento agora ou ligar 192 (SAMU). Já estou avisando a Dra. Cintia.` });
  }
  if (tem(ultima, "dor", "normal", "efeito", "sintoma", "estufa", "enjoo")) {
    s.push({ rotulo: "Passar para a Dra", texto: `Oi ${n}! Obrigada por avisar. Vou passar agora para a Dra. Cintia avaliar e te retorno aqui ainda hoje 🤍` });
  }
  if (tem(ultima, "valor", "preco", "quanto", "custa", "cartao", "pagamento", "parcel")) {
    s.push({ rotulo: "Enviar valores", texto: `Oi ${n}! A consulta com a Dra. Cintia é [valor], e aceitamos [formas de pagamento]. Quer que eu veja os horários livres desta semana?` });
    etapa = l.etapa === "novo" ? "protocolo" : null;
  }
  if (tem(ultima, "online", "distancia", "moro em", "outra cidade")) {
    s.push({ rotulo: "Consulta online", texto: `Atende sim, ${n}! A consulta pode ser online, com a mesma estrutura da presencial. Posso te passar os horários?` });
  }
  if (tem(ultima, "convenio", "plano de saude", "unimed", "reembolso")) {
    s.push({ rotulo: "Convênio", texto: `${n}, o atendimento da Dra. Cintia é particular, mas os exames que ela pedir podem ser feitos pelo seu convênio.` });
  }
  if (tem(ultima, "receita", "renov")) {
    s.push({ rotulo: "Receita", texto: `Oi ${n}! Vou pedir para a Dra. Cintia renovar sua receita e te envio por aqui assim que estiver pronta.` });
  }
  if (tem(ultima, "exame", "resultado")) {
    s.push({ rotulo: "Exames", texto: `Recebi, ${n}! Vou encaminhar seus exames para a Dra. Cintia avaliar e te dou retorno por aqui.` });
  }
  if (tem(ultima, "agendar", "marcar", "horario", "decidi", "fechar")) {
    s.push({ rotulo: "Oferecer horários", texto: `Que bom, ${n}! Tenho [dia] às [hora] ou [dia] às [hora]. Qual fica melhor pra você?` });
    if (["novo", "protocolo", "retorno"].includes(l.etapa)) etapa = "agendar";
  }
  s.push({ rotulo: "Acolher", texto: `Oi ${n}, tudo bem? Obrigada pela mensagem! Me conta um pouquinho mais pra eu te ajudar da melhor forma 🤍` });
  s.push({ rotulo: "Como é a consulta", texto: `${n}, na consulta a Dra. Cintia tem tempo para entender seu histórico, rotina e objetivos, e monta um tratamento individualizado pra você.` });

  const unicas = s.filter((x, i) => s.findIndex((y) => y.rotulo === x.rotulo) === i).slice(0, 3);
  return { sugestoes: unicas, etapa, motivo: etapa ? "Pela última mensagem da paciente" : null, fonte: "local" };
}

export async function pedirSugestoes(l: Lead): Promise<Resultado> {
  try {
    const r = await fetch("/api/sugestoes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paciente: { nome: l.nome, interesse: l.interesse, etapa: l.etapa }, msgs: l.msgs.slice(-12).map(({ de, texto }) => ({ de, texto })) }),
    });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    return { sugestoes: j.sugestoes, etapa: j.etapa ?? null, motivo: j.motivo ?? null, fonte: "ia" };
  } catch {
    return sugestoesLocais(l);
  }
}
