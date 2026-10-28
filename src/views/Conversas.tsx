"use client";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ArrowLeft, CheckCircle2, IdCard, MessageCircle, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, EtapaSelect, TagChip } from "@/components/bits";
import { ChatThread } from "@/components/Chat";
import { aguardandoClinica, quandoMsg, ultimaMsg } from "@/lib/fmt";
import { useCRM } from "@/lib/store";
import { CATEGORIAS, EQUIPE, EU, etapa, type Categoria, type Lead } from "@/lib/types";
import { rectDe, useUI } from "@/lib/ui";

type Filtro = "todas" | "naolidas" | "minhas" | "sem" | "resolvidas";
const CAT_COR: Record<Categoria, string> = { Agendamento: "tag-ouro", "Dúvida": "tag-ceu", Receita: "tag-salvia", "Resultado de exame": "tag-terra", Remarcar: "tag-cinza" };
const iniciais = (id: string | null) => EQUIPE.find((e) => e.id === id)?.nome.replace("Dra. ", "Dr").slice(0, 2).toUpperCase() ?? "";

function Item({ l, ativo, onClick }: { l: Lead; ativo: boolean; onClick: () => void }) {
  const m = ultimaMsg(l);
  const resp = EQUIPE.find((e) => e.id === l.responsavel);
  return (
    <motion.li layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}>
      <button type="button" onClick={onClick} className="relative w-full text-left flex gap-3 p-3 rounded-xl cursor-pointer">
        {ativo && <motion.span layoutId="conv-ativa" className="absolute inset-0 rounded-xl" style={{ background: "var(--gold-soft)" }} transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
        <span className="relative"><Avatar nome={l.nome} size={38} />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full" style={{ background: etapa(l.etapa).cor, border: "2px solid var(--surface)" }} title={etapa(l.etapa).nome} />
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className={`truncate flex-1 ${l.naoLidas ? "font-semibold" : "font-medium"}`}>{l.nome}</span>
            <span className="text-[11px] flex-none" style={{ color: l.naoLidas ? "var(--gold-ink)" : "var(--muted)" }}>{m ? quandoMsg(m.t) : ""}</span>
          </span>
          <span className="flex items-center gap-2 mt-0.5">
            <span className="truncate flex-1 text-[12.5px]" style={{ color: l.naoLidas ? "var(--ink)" : "var(--muted)" }}>{m ? (m.de === "c" ? "Você: " : "") + m.texto : "Sem mensagens"}</span>
            {l.naoLidas > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="badge">{l.naoLidas}</motion.span>}
          </span>
          <span className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {l.urgente && <span className="tag tag-rosa !text-[10.5px] !py-0"><AlertTriangle size={10} />Urgente</span>}
            {l.categoria && <span className={`tag ${CAT_COR[l.categoria]} !text-[10.5px] !py-0`}>{l.categoria}</span>}
            <span className="ml-auto text-[10.5px] flex items-center gap-1" style={{ color: "var(--muted)" }}>
              {resp ? <><span className="w-4 h-4 rounded-full grid place-items-center text-[8px] font-semibold" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>{iniciais(resp.id)}</span>{resp.nome}</> : "Sem responsável"}
            </span>
          </span>
        </span>
      </button>
    </motion.li>
  );
}

export function Conversas() {
  const { leads, mover, update } = useCRM();
  const { conversaId, setConversaId, abrirFicha } = useUI();
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const comConversa = leads.filter((l) => l.msgs.length > 0 || l.id === conversaId);
  const abertas = comConversa.filter((l) => !l.resolvida);
  const cont: Record<Filtro, number> = {
    todas: abertas.length, naolidas: abertas.filter((l) => l.naoLidas > 0).length,
    minhas: abertas.filter((l) => l.responsavel === EU).length, sem: abertas.filter((l) => !l.responsavel).length,
    resolvidas: comConversa.filter((l) => l.resolvida).length,
  };
  const lista = useMemo(() => (filtro === "resolvidas" ? comConversa.filter((l) => l.resolvida) : abertas)
    .filter((l) => !q || l.nome.toLowerCase().includes(q.toLowerCase()) || ultimaMsg(l)?.texto.toLowerCase().includes(q.toLowerCase()))
    .filter((l) => filtro === "naolidas" ? l.naoLidas > 0 : filtro === "minhas" ? l.responsavel === EU : filtro === "sem" ? !l.responsavel : true)
    .sort((a, b) => Number(b.urgente) - Number(a.urgente) || (ultimaMsg(b)?.t ?? b.criado) - (ultimaMsg(a)?.t ?? a.criado)),
  [leads, q, filtro, conversaId]);

  const atual = leads.find((l) => l.id === conversaId) ?? null;
  const aguardando = abertas.filter(aguardandoClinica).length;
  const FILTROS: { v: Filtro; l: string }[] = [
    { v: "todas", l: "Abertas" }, { v: "naolidas", l: "Não lidas" }, { v: "minhas", l: "Minhas" }, { v: "sem", l: "Sem dono" }, { v: "resolvidas", l: "Resolvidas" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden md:flex flex-wrap items-end gap-3">
        <div className="flex-1"><div className="eyebrow mb-1">WhatsApp da clínica · {aguardando} esperando resposta</div><h1 className="display text-[34px] leading-none m-0">Conversas</h1></div>
        {[["Não lidas", cont.naolidas], ["Esperando a clínica", aguardando], ["Resposta mediana", "9 min"], ["Abertas", cont.todas]].map(([l, v]) => (
          <div key={l as string} className="panel !rounded-xl px-3.5 py-2 text-center min-w-[96px]"><div className="display text-[22px] leading-none num">{v}</div><div className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>{l}</div></div>
        ))}
      </div>
      <div className="panel !rounded-[20px] overflow-hidden flex h-[calc(100dvh-170px)] md:h-[calc(100dvh-200px)] min-h-[520px]">
        {/* Lista */}
        <div className={`${atual ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-[370px] flex-none`} style={{ borderRight: "1px solid var(--line)" }}>
          <div className="p-3.5 flex flex-col gap-2.5" style={{ borderBottom: "1px solid var(--line)" }}>
            <h1 className="md:hidden display text-[26px] m-0">Conversas</h1>
            <label className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
              <input id="conv-busca" className="field !pl-9" placeholder="Buscar nome ou mensagem" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar conversa" />
            </label>
            <div className="flex gap-1 overflow-x-auto scroll-thin -mx-1 px-1 pb-0.5" role="group" aria-label="Filtrar conversas">
              {FILTROS.map((f) => (
                <button key={f.v} type="button" aria-pressed={filtro === f.v} onClick={() => setFiltro(f.v)}
                  className="relative flex-none text-[12.5px] px-2.5 py-1.5 rounded-lg cursor-pointer" style={{ color: filtro === f.v ? "var(--ink)" : "var(--muted)" }}>
                  {filtro === f.v && <motion.span layoutId="conv-filtro" className="absolute inset-0 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }} transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                  <span className="relative">{f.l} <span className="num opacity-70">{cont[f.v]}</span></span>
                </button>
              ))}
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto scroll-thin m-0 p-2 list-none">
            <AnimatePresence initial={false}>
              {lista.map((l) => <Item key={l.id} l={l} ativo={l.id === conversaId} onClick={() => setConversaId(l.id)} />)}
            </AnimatePresence>
            {lista.length === 0 && <li className="text-center text-[13px] py-10" style={{ color: "var(--muted)" }}>Nenhuma conversa neste filtro.</li>}
          </ul>
        </div>

        {/* Conversa aberta */}
        <div className={`${atual ? "flex" : "hidden lg:flex"} flex-1 min-w-0 flex-col`}>
          {atual ? (
            <>
              <div className="flex flex-wrap items-center gap-2.5 px-4 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
                <button type="button" className="icon-btn lg:hidden" onClick={() => setConversaId(null)} aria-label="Voltar para a lista"><ArrowLeft size={17} /></button>
                <Avatar nome={atual.nome} size={38} />
                <div className="flex-1 min-w-[150px]">
                  <div className="font-medium flex items-center gap-2">{atual.nome}{atual.optin !== "sim" && <span className="tag tag-cinza !text-[10px] !py-0" title="Sem consentimento: só pode receber resposta dentro de 24h da última mensagem dela">Só responder</span>}</div>
                  <div className="text-[12px] flex flex-wrap gap-1.5 items-center" style={{ color: "var(--muted)" }}>{atual.tel} · {atual.interesse}{atual.tags.slice(0, 2).map((t) => <TagChip key={t} nome={t} />)}</div>
                </div>
                <EtapaSelect id="conv-etapa" value={atual.etapa} onChange={(v) => mover(atual.id, v)} />
                <button type="button" className="btn !py-1.5" onClick={(e) => abrirFicha(atual.id, rectDe(e.currentTarget))}><IdCard size={15} />Ficha</button>
                {atual.resolvida ? (
                  <button type="button" className="btn !py-1.5" onClick={() => update(atual.id, { resolvida: false })}><RotateCcw size={15} />Reabrir</button>
                ) : (
                  <button type="button" className="btn !py-1.5" onClick={() => update(atual.id, { resolvida: true, naoLidas: 0 })}><CheckCircle2 size={15} style={{ color: "var(--ok)" }} />Resolver</button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 px-4 py-2 text-[12.5px]" style={{ borderBottom: "1px solid var(--line)", background: "var(--surface-2)" }}>
                <label htmlFor="conv-resp" style={{ color: "var(--muted)" }}>Responsável</label>
                <select id="conv-resp" className="field !w-auto !py-1 !text-[12.5px]" value={atual.responsavel ?? ""} onChange={(e) => update(atual.id, { responsavel: e.target.value || null })}>
                  <option value="">Ninguém</option>{EQUIPE.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
                <label htmlFor="conv-cat" className="ml-2" style={{ color: "var(--muted)" }}>Assunto</label>
                <select id="conv-cat" className="field !w-auto !py-1 !text-[12.5px]" value={atual.categoria ?? ""} onChange={(e) => update(atual.id, { categoria: (e.target.value || null) as Categoria | null })}>
                  <option value="">Sem assunto</option>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                </select>
                <button type="button" aria-pressed={atual.urgente} onClick={() => update(atual.id, { urgente: !atual.urgente })}
                  className={`tag ${atual.urgente ? "tag-rosa" : "tag-cinza"} cursor-pointer ml-auto`}><AlertTriangle size={11} />{atual.urgente ? "Urgente" : "Marcar urgente"}</button>
              </div>
              <div className="flex-1 min-h-0"><ChatThread key={atual.id} l={atual} /></div>
            </>
          ) : (
            <div className="m-auto text-center max-w-[320px] p-6">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-16 h-16 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: "var(--gold-soft)", color: "var(--gold-ink)" }}>
                <MessageCircle size={28} />
              </motion.div>
              <div className="display text-[24px]">Escolha uma conversa</div>
              <p className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>As respostas saem do WhatsApp da clínica, e a equipe vê a mesma caixa. Digite / para usar um modelo, ou use as sugestões da IA.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
