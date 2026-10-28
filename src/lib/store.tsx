"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { seed, TAGS_PADRAO } from "./seed";
import { etapa, type EtapaId, type Lead, type Tag } from "./types";

// shortcut: dados ficam no localStorage do navegador (demo). Trocar por Supabase quando o cliente fechar.
const KEY = "cmc-crm-v2";
type Estado = { leads: Lead[]; tags: Tag[] };

function carregar(): Estado {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s && Array.isArray(s.leads) && Array.isArray(s.tags)) return s;
  } catch {}
  return { leads: seed(), tags: TAGS_PADRAO };
}

type Ctx = Estado & {
  get: (id: string) => Lead | undefined;
  update: (id: string, patch: Partial<Lead>, evento?: Lead["hist"][number]) => void;
  mover: (id: string, et: EtapaId) => void;
  criar: (dados: Partial<Lead>) => string;
  remover: (id: string) => void;
  enviar: (id: string, texto: string) => void;
  lerConversa: (id: string) => void;
  criarTag: (t: Tag) => void;
  resetar: () => void;
  digitando: string | null;
};

const C = createContext<Ctx | null>(null);
export const useCRM = () => useContext(C)!;

const RESPOSTAS = [
  "Perfeito, obrigada! 🤍",
  "Combinado! Fico no aguardo",
  "Ah que ótimo, pode ser sim",
  "Obrigada pelo retorno rápido!",
];

export function CRMProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<Estado>(carregar);
  const [digitando, setDigitando] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {}
  }, [st]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const setLeads = useCallback((fn: (l: Lead[]) => Lead[]) => setSt((s) => ({ ...s, leads: fn(s.leads) })), []);

  const update: Ctx["update"] = useCallback((id, patch, evento) => {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch, hist: evento ? [...l.hist, evento] : l.hist } : l)));
  }, [setLeads]);

  const mover: Ctx["mover"] = useCallback((id, et) => {
    const now = Date.now();
    setLeads((ls) => ls.map((l) => l.id !== id || l.etapa === et ? l : {
      ...l, etapa: et, mov: now, hist: [...l.hist, { t: now, tipo: "etapa", texto: `Movida para ${etapa(et).nome}` }],
    }));
  }, [setLeads]);

  const criar: Ctx["criar"] = useCallback((d) => {
    const now = Date.now();
    const id = `l${now.toString(36)}`;
    const l: Lead = {
      id, nome: "", tel: "", email: "", cidade: "", nascimento: "", origem: "Instagram", interesse: "Emagrecimento",
      etapa: "novo", tags: [], valor: 0, criado: now, mov: now, consulta: null, modalidade: "Presencial",
      dra: null, hist: [{ t: now, tipo: "criado", texto: `Cadastrada pela recepção` }], msgs: [], naoLidas: 0, ...d,
    };
    setLeads((ls) => [l, ...ls]);
    return id;
  }, [setLeads]);

  const remover = useCallback((id: string) => setLeads((ls) => ls.filter((l) => l.id !== id)), [setLeads]);

  const enviar: Ctx["enviar"] = useCallback((id, texto) => {
    const now = Date.now();
    setLeads((ls) => ls.map((l) => l.id === id ? { ...l, naoLidas: 0, msgs: [...l.msgs, { id: `m${now}`, t: now, de: "c", texto }] } : l));
    // Demo: simula a paciente respondendo. Na versão real isso vem do webhook da WhatsApp Cloud API.
    const t1 = window.setTimeout(() => setDigitando(id), 900);
    const t2 = window.setTimeout(() => {
      setDigitando(null);
      const t = Date.now();
      setLeads((ls) => ls.map((l) => l.id === id ? {
        ...l, msgs: [...l.msgs, { id: `m${t}`, t, de: "p", texto: RESPOSTAS[Math.floor(Math.random() * RESPOSTAS.length)] }],
      } : l));
    }, 2800);
    timers.current.push(t1, t2);
  }, [setLeads]);

  const lerConversa = useCallback((id: string) => setLeads((ls) => ls.map((l) => l.id === id && l.naoLidas ? { ...l, naoLidas: 0 } : l)), [setLeads]);
  const criarTag = useCallback((t: Tag) => setSt((s) => s.tags.some((x) => x.nome === t.nome) ? s : { ...s, tags: [...s.tags, t] }), []);
  const resetar = useCallback(() => setSt({ leads: seed(), tags: TAGS_PADRAO }), []);
  const get = useCallback((id: string) => st.leads.find((l) => l.id === id), [st.leads]);

  const value = useMemo(() => ({ ...st, get, update, mover, criar, remover, enviar, lerConversa, criarTag, resetar, digitando }),
    [st, get, update, mover, criar, remover, enviar, lerConversa, criarTag, resetar, digitando]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
