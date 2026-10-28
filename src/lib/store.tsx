"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CONFIG_PADRAO, MODELOS_PADRAO, TAGS_PADRAO, agoraClinica, seed, seedCampanhas } from "./seed";
import { DIA, etapa, type Campanha, type Config, type EtapaId, type Fluxo, type Lead, type Modelo, type Publico, type Tag } from "./types";

// shortcut: dados ficam no localStorage do navegador (demo). Trocar por Supabase quando o cliente fechar.
const KEY = "cmc-crm-v3";
type Estado = { leads: Lead[]; tags: Tag[]; campanhas: Campanha[]; modelos: Modelo[]; config: Config };

const novo = (): Estado => ({ leads: seed(), tags: TAGS_PADRAO, campanhas: seedCampanhas(), modelos: MODELOS_PADRAO, config: CONFIG_PADRAO });
function carregar(): Estado {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s && Array.isArray(s.leads) && Array.isArray(s.campanhas)) return { ...novo(), ...s, config: { ...CONFIG_PADRAO, ...s.config } };
  } catch {}
  return novo();
}

// Preenche {{nome}}, {{hora}} e {{interesse}} de um modelo para uma paciente.
export function preencher(texto: string, l: Pick<Lead, "nome" | "interesse" | "consulta">) {
  return texto
    .replaceAll("{{nome}}", l.nome.split(" ")[0])
    .replaceAll("{{interesse}}", l.interesse.toLowerCase())
    .replaceAll("{{hora}}", l.consulta ? new Date(l.consulta).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");
}

// Quem recebe uma campanha: filtra pelo público e separa quem não deu consentimento no WhatsApp.
export function destinatarios(leads: Lead[], p: Publico) {
  const alvo = leads.filter((l) =>
    (!p.etapas.length || p.etapas.includes(l.etapa)) &&
    (!p.tags.length || p.tags.some((t) => l.tags.includes(t))) &&
    (!p.interesses.length || p.interesses.includes(l.interesse)));
  return { ok: alvo.filter((l) => l.optin === "sim"), pendente: alvo.filter((l) => l.optin === "pendente").length, recusou: alvo.filter((l) => l.optin === "nao").length };
}

export const amanha = () => { const x = new Date(); x.setHours(0, 0, 0, 0); return [x.getTime() + DIA, x.getTime() + 2 * DIA] as const; };

type Ctx = Estado & {
  get: (id: string) => Lead | undefined;
  update: (id: string, patch: Partial<Lead>, evento?: Lead["hist"][number]) => void;
  mover: (id: string, et: EtapaId) => void;
  criar: (dados: Partial<Lead>) => string;
  remover: (id: string) => void;
  enviar: (id: string, texto: string) => void;
  lerConversa: (id: string) => void;
  criarTag: (t: Tag) => void;
  avancarFluxo: (id: string, f: Fluxo) => void;
  enviarLembretes: () => number;
  salvarCampanha: (c: Campanha) => void;
  dispararCampanha: (id: string, c?: Campanha) => void;
  removerCampanha: (id: string) => void;
  salvarModelo: (m: Modelo) => void;
  setConfig: (c: Partial<Config>) => void;
  resetar: () => void;
  digitando: string | null;
};

const C = createContext<Ctx | null>(null);
export const useCRM = () => useContext(C)!;

const RESPOSTAS = ["Perfeito, obrigada! 🤍", "Combinado! Fico no aguardo", "Ah que ótimo, pode ser sim", "Obrigada pelo retorno rápido!"];
const FLUXO_TXT: Record<Fluxo, string> = { esperada: "Consulta esperada", recepcao: "Chegou na recepção", consulta: "Entrou em consulta", atendida: "Consulta finalizada", faltou: "Não compareceu" };

export function CRMProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<Estado>(carregar);
  const [digitando, setDigitando] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const depois = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} }, [st]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const setLeads = useCallback((fn: (l: Lead[]) => Lead[]) => setSt((s) => ({ ...s, leads: fn(s.leads) })), []);
  const um = useCallback((id: string, fn: (l: Lead) => Lead) => setLeads((ls) => ls.map((l) => (l.id === id ? fn(l) : l))), [setLeads]);

  const update: Ctx["update"] = useCallback((id, patch, evento) => um(id, (l) => ({ ...l, ...patch, hist: evento ? [...l.hist, evento] : l.hist })), [um]);

  const mover: Ctx["mover"] = useCallback((id, et) => {
    const now = Date.now();
    um(id, (l) => l.etapa === et ? l : { ...l, etapa: et, mov: now, hist: [...l.hist, { t: now, tipo: "etapa", texto: `Movida para ${etapa(et).nome}` }] });
  }, [um]);

  const criar: Ctx["criar"] = useCallback((d) => {
    const now = Date.now();
    const id = `l${now.toString(36)}`;
    const l: Lead = {
      id, nome: "", tel: "", email: "", cidade: "", nascimento: "", origem: "Instagram", interesse: "Emagrecimento",
      etapa: "novo", tags: [], valor: 0, criado: now, mov: now, consulta: null, modalidade: "Presencial",
      dra: null, hist: [{ t: now, tipo: "criado", texto: "Cadastrada pela recepção" }], msgs: [], naoLidas: 0,
      optin: "pendente", responsavel: "ana", categoria: null, urgente: false, resolvida: false,
      tipo: "Primeira consulta", fluxo: null, chegada: null, confirmada: false, lembrete: null, ...d,
    };
    setLeads((ls) => [l, ...ls]);
    return id;
  }, [setLeads]);

  const remover = useCallback((id: string) => setLeads((ls) => ls.filter((l) => l.id !== id)), [setLeads]);

  const enviar: Ctx["enviar"] = useCallback((id, texto) => {
    const now = Date.now();
    um(id, (l) => ({ ...l, naoLidas: 0, resolvida: false, responsavel: l.responsavel ?? "ana", msgs: [...l.msgs, { id: `m${now}`, t: now, de: "c", texto }] }));
    // Demo: simula a paciente respondendo. Na versão real isso vem do webhook da WhatsApp Cloud API.
    depois(900, () => setDigitando(id));
    depois(2800, () => {
      setDigitando(null);
      const t = Date.now();
      um(id, (l) => ({ ...l, msgs: [...l.msgs, { id: `m${t}`, t, de: "p", texto: RESPOSTAS[Math.floor(Math.random() * RESPOSTAS.length)] }] }));
    });
  }, [um]);

  const lerConversa = useCallback((id: string) => setLeads((ls) => ls.map((l) => l.id === id && l.naoLidas ? { ...l, naoLidas: 0 } : l)), [setLeads]);
  const criarTag = useCallback((t: Tag) => setSt((s) => s.tags.some((x) => x.nome === t.nome) ? s : { ...s, tags: [...s.tags, t] }), []);

  const avancarFluxo: Ctx["avancarFluxo"] = useCallback((id, f) => {
    const now = Date.now();
    um(id, (l) => ({ ...l, fluxo: f, chegada: f === "recepcao" ? agoraClinica() : l.chegada, hist: [...l.hist, { t: now, tipo: "consulta", texto: FLUXO_TXT[f] }] }));
  }, [um]);

  // Lembretes de amanhã: envia, e na demo as pacientes vão lendo e confirmando aos poucos.
  const enviarLembretes = useCallback(() => {
    const [ini, fim] = amanha();
    const alvo = st.leads.filter((l) => l.consulta && l.consulta >= ini && l.consulta < fim && l.optin === "sim" && !l.lembrete).map((l) => l.id);
    if (!alvo.length) return 0;
    const now = Date.now();
    setLeads((ls) => ls.map((l) => alvo.includes(l.id) ? {
      ...l, lembrete: "enviado", msgs: [...l.msgs, { id: `lem${now}${l.id}`, t: now, de: "c", texto: preencher(st.config.textoLembrete, l) }],
      hist: [...l.hist, { t: now, tipo: "consulta", texto: "Lembrete de consulta enviado" }],
    } : l));
    alvo.forEach((id, i) => {
      depois(1200 + i * 500, () => um(id, (l) => l.lembrete === "enviado" ? { ...l, lembrete: "lido" } : l));
      if (i % 3 !== 2) depois(2600 + i * 700, () => um(id, (l) => {
        const t = Date.now();
        return { ...l, lembrete: "confirmado", confirmada: true, msgs: [...l.msgs, { id: `conf${t}`, t, de: "p", texto: "Confirmado! 🤍" }] };
      }));
    });
    return alvo.length;
  }, [st.leads, st.config.textoLembrete, setLeads, um]);

  const salvarCampanha = useCallback((c: Campanha) => setSt((s) => ({ ...s, campanhas: s.campanhas.some((x) => x.id === c.id) ? s.campanhas.map((x) => x.id === c.id ? c : x) : [c, ...s.campanhas] })), []);
  const removerCampanha = useCallback((id: string) => setSt((s) => ({ ...s, campanhas: s.campanhas.filter((c) => c.id !== id) })), []);

  // Disparo simulado: a mensagem entra na conversa de cada destinatária e os números sobem como numa entrega real.
  const dispararCampanha = useCallback((id: string, nova?: Campanha) => {
    const c = nova ?? st.campanhas.find((x) => x.id === id); if (!c) return;
    const modelo = st.modelos.find((m) => m.id === c.modelo); if (!modelo) return;
    const { ok } = destinatarios(st.leads, c.publico);
    const now = Date.now(), n = ok.length;
    setSt((s) => ({
      ...s,
      campanhas: s.campanhas.map((x) => x.id === id ? { ...x, status: "enviando", enviadaEm: now, quando: now, metricas: { enviadas: 0, entregues: 0, lidas: 0, respondidas: 0, agendadas: 0 } } : x),
      leads: s.leads.map((l) => ok.some((o) => o.id === l.id) ? { ...l, msgs: [...l.msgs, { id: `camp${id}${now}`, t: now, de: "c", texto: preencher(modelo.texto, l) }] } : l),
    }));
    const passo = (ms: number, m: Partial<NonNullable<Campanha["metricas"]>>, fim = false) => depois(ms, () => setSt((s) => ({
      ...s, campanhas: s.campanhas.map((x) => x.id === id && x.metricas ? { ...x, status: fim ? "enviada" : x.status, metricas: { ...x.metricas, ...m } } : x),
    })));
    passo(500, { enviadas: n });
    passo(1300, { entregues: n });
    passo(2400, { lidas: Math.max(0, Math.round(n * 0.85)) });
    passo(3600, { respondidas: Math.round(n * 0.35), agendadas: Math.round(n * 0.15) }, true);
  }, [st.campanhas, st.modelos, st.leads]);

  const salvarModelo = useCallback((m: Modelo) => setSt((s) => ({ ...s, modelos: s.modelos.some((x) => x.id === m.id) ? s.modelos.map((x) => x.id === m.id ? m : x) : [...s.modelos, m] })), []);
  const setConfig = useCallback((c: Partial<Config>) => setSt((s) => ({ ...s, config: { ...s.config, ...c } })), []);
  const resetar = useCallback(() => setSt(novo()), []);
  const get = useCallback((id: string) => st.leads.find((l) => l.id === id), [st.leads]);

  const value = useMemo(() => ({
    ...st, get, update, mover, criar, remover, enviar, lerConversa, criarTag, avancarFluxo, enviarLembretes,
    salvarCampanha, dispararCampanha, removerCampanha, salvarModelo, setConfig, resetar, digitando,
  }), [st, get, update, mover, criar, remover, enviar, lerConversa, criarTag, avancarFluxo, enviarLembretes, salvarCampanha, dispararCampanha, removerCampanha, salvarModelo, setConfig, resetar, digitando]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export { agoraClinica };
