"use client";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, IdCard, MessageCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, EtapaSelect, Seg, TagChip } from "@/components/bits";
import { ChatThread } from "@/components/Chat";
import { aguardandoClinica, quandoMsg, ultimaMsg } from "@/lib/fmt";
import { useCRM } from "@/lib/store";
import { etapa } from "@/lib/types";
import { rectDe, useUI } from "@/lib/ui";

type Filtro = "todas" | "naolidas" | "aguardando";

export function Conversas() {
  const { leads, mover } = useCRM();
  const { conversaId, setConversaId, abrirFicha } = useUI();
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const lista = useMemo(() => leads
    .filter((l) => l.msgs.length > 0 || l.id === conversaId)
    .filter((l) => !q || l.nome.toLowerCase().includes(q.toLowerCase()) || ultimaMsg(l)?.texto.toLowerCase().includes(q.toLowerCase()))
    .filter((l) => filtro === "todas" || (filtro === "naolidas" ? l.naoLidas > 0 : aguardandoClinica(l)))
    .sort((a, b) => (ultimaMsg(b)?.t ?? b.criado) - (ultimaMsg(a)?.t ?? a.criado)), [leads, q, filtro, conversaId]);

  const atual = leads.find((l) => l.id === conversaId) ?? null;
  const naoLidas = leads.filter((l) => l.naoLidas > 0).length;
  const aguardando = leads.filter(aguardandoClinica).length;

  return (
    <div className="panel !rounded-[20px] overflow-hidden flex h-[calc(100dvh-170px)] md:h-[calc(100dvh-120px)] min-h-[520px]">
      {/* Lista */}
      <div className={`${atual ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-[360px] flex-none`} style={{ borderRight: "1px solid var(--line)" }}>
        <div className="p-4 flex flex-col gap-3" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center justify-between">
            <h1 className="display text-[28px] m-0">Conversas</h1>
            <span className="text-[12px] flex items-center gap-1.5" style={{ color: "var(--muted)" }}><span className="dot" style={{ background: "#58B368" }} />WhatsApp</span>
          </div>
          <label className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
            <input id="conv-busca" className="field !pl-9" placeholder="Buscar nome ou mensagem" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar conversa" />
          </label>
          <Seg id="conv-filtro" value={filtro} onChange={setFiltro} opcoes={[
            { v: "todas", label: "Todas" }, { v: "naolidas", label: `Não lidas ${naoLidas}` }, { v: "aguardando", label: `Responder ${aguardando}` },
          ]} />
        </div>
        <ul className="flex-1 overflow-y-auto scroll-thin m-0 p-2 list-none">
          <AnimatePresence initial={false}>
            {lista.map((l) => {
              const m = ultimaMsg(l), ativo = l.id === conversaId;
              return (
                <motion.li key={l.id} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <button type="button" onClick={() => setConversaId(l.id)} className="relative w-full text-left flex gap-3 p-3 rounded-xl cursor-pointer">
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
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
          {lista.length === 0 && <li className="text-center text-[13px] py-10" style={{ color: "var(--muted)" }}>Nenhuma conversa neste filtro.</li>}
        </ul>
      </div>

      {/* Conversa aberta */}
      <div className={`${atual ? "flex" : "hidden lg:flex"} flex-1 min-w-0 flex-col`}>
        {atual ? (
          <>
            <div className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
              <button type="button" className="icon-btn lg:hidden" onClick={() => setConversaId(null)} aria-label="Voltar para a lista"><ArrowLeft size={17} /></button>
              <Avatar nome={atual.nome} size={38} />
              <div className="flex-1 min-w-[140px]">
                <div className="font-medium">{atual.nome}</div>
                <div className="text-[12px] flex flex-wrap gap-1.5 items-center" style={{ color: "var(--muted)" }}>
                  {atual.tel} · {atual.interesse}
                  {atual.tags.slice(0, 2).map((t) => <TagChip key={t} nome={t} />)}
                </div>
              </div>
              <EtapaSelect id="conv-etapa" value={atual.etapa} onChange={(v) => mover(atual.id, v)} />
              <button type="button" className="btn" onClick={(e) => abrirFicha(atual.id, rectDe(e.currentTarget))}><IdCard size={15} />Ficha</button>
            </div>
            <div className="flex-1 min-h-0"><ChatThread key={atual.id} l={atual} /></div>
          </>
        ) : (
          <div className="m-auto text-center max-w-[300px] p-6">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-16 h-16 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: "var(--gold-soft)", color: "var(--gold-ink)" }}>
              <MessageCircle size={28} />
            </motion.div>
            <div className="display text-[24px]">Escolha uma conversa</div>
            <p className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>As mensagens do WhatsApp da clínica chegam aqui. Ao responder, a paciente continua no funil certo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
