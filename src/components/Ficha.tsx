"use client";
import { AnimatePresence, motion } from "motion/react";
import { CalendarClock, Clock3, MessageCircle, Plus, Stethoscope, StickyNote, Tag as TagIcon, Trash2, UserPlus, X, ArrowRightLeft } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Avatar, EtapaSelect, Seg, TagChip } from "@/components/bits";
import { ChatThread } from "@/components/Chat";
import { brl, data, hora, quando } from "@/lib/fmt";
import { useCRM } from "@/lib/store";
import { INTERESSES, ORIGENS, TAG_CORES, type Evento, type Lead, type TagCor } from "@/lib/types";
import type { Rect } from "@/lib/ui";
import { useUI } from "@/lib/ui";

const ICONE: Record<Evento["tipo"], typeof Clock3> = { criado: UserPlus, etapa: ArrowRightLeft, nota: StickyNote, tag: TagIcon, dra: Stethoscope, consulta: CalendarClock };

const toLocal = (t: number | null) => {
  if (!t) return "";
  const d = new Date(t); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

function Campo({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><label className="label" htmlFor={id}>{label}</label>{children}</div>;
}

export function Ficha({ id, origem, foco, onClose }: { id: string; origem: Rect | null; foco?: "nome"; onClose: () => void }) {
  const { get, update, mover, remover, tags, criarTag } = useCRM();
  const { abrirConversa } = useUI();
  const l = get(id);
  const painel = useRef<HTMLDivElement>(null);
  const [clip, setClip] = useState<string | null>(null);
  const [aba, setAba] = useState<"hist" | "chat">("hist");
  const [nota, setNota] = useState("");
  const [novaTag, setNovaTag] = useState(""); const [corTag, setCorTag] = useState<TagCor>("ouro");
  const [apagar, setApagar] = useState(false);
  const [nome, setNome] = useState(l?.nome ?? "");

  // O card "abre" para virar a ficha: começamos com o painel recortado no formato do card
  // e animamos o recorte até o painel inteiro. Sem distorcer o texto.
  useLayoutEffect(() => {
    if (!painel.current) return;
    const p = painel.current.getBoundingClientRect();
    if (origem) {
      const t = Math.max(0, origem.top - p.top), le = Math.max(0, origem.left - p.left);
      const b = Math.max(0, p.bottom - (origem.top + origem.height)), r = Math.max(0, p.right - (origem.left + origem.width));
      setClip(`inset(${t}px ${r}px ${b}px ${le}px round 14px)`);
    } else setClip(`inset(40% 30% 40% 30% round 20px)`);
  }, [origem]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") fechar(); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });

  if (!l) return null;
  const fechar = () => { if (!l.nome.trim() && !nome.trim()) remover(l.id); onClose(); };
  const salvarNome = () => { const v = nome.trim(); if (v && v !== l.nome) update(l.id, { nome: v }); };
  const set = (patch: Partial<Lead>) => update(l.id, patch);
  const ev = (tipo: Evento["tipo"], texto: string): Evento => ({ t: Date.now(), tipo, texto });

  const timeline = [...l.hist].sort((a, b) => b.t - a.t);
  const semTag = tags.filter((t) => !l.tags.includes(t.nome));

  return (
    <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center md:p-6" role="dialog" aria-modal="true" aria-label={`Ficha de ${l.nome || "paciente"}`}>
      <motion.div className="absolute inset-0" style={{ background: "rgb(20 14 8 / .42)", backdropFilter: "blur(3px)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={fechar} />
      <motion.div ref={painel}
        className="relative w-full md:max-w-[1040px] md:h-[min(760px,92vh)] h-full flex flex-col overflow-hidden md:rounded-[22px]"
        style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)", visibility: clip ? "visible" : "hidden" }}
        initial={false}
        animate={clip ? { clipPath: [clip, "inset(0px 0px 0px 0px round 22px)"] } : undefined}
        exit={{ clipPath: clip ?? "inset(50% round 22px)", opacity: 0.4 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}>

        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--line)", paddingTop: "max(16px, env(safe-area-inset-top))" }}>
          <Avatar nome={nome || l.nome} size={46} />
          <div className="flex-1 min-w-[180px]">
            <input id="ficha-nome" autoFocus={foco === "nome"} className="display text-[28px] leading-tight bg-transparent border-0 w-full p-0 focus:outline-none"
              value={nome} placeholder="Nome da paciente" onChange={(e) => setNome(e.target.value)} onBlur={salvarNome} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} aria-label="Nome" />
            <div className="text-[12.5px] flex flex-wrap gap-x-3" style={{ color: "var(--muted)" }}>
              <span>Entrou {quando(l.criado)} pelo {l.origem}</span>
              {l.valor > 0 && <span>Protocolo {brl(l.valor)}</span>}
            </div>
          </div>
          <EtapaSelect id="ficha-etapa" value={l.etapa} onChange={(v) => mover(l.id, v)} />
          <button type="button" className="btn" onClick={() => { salvarNome(); abrirConversa(l.id); }}><MessageCircle size={15} />Conversa</button>
          <button type="button" className="icon-btn" onClick={fechar} aria-label="Fechar ficha"><X size={17} /></button>
        </div>

        <div className="flex-1 min-h-0 grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] overflow-y-auto md:overflow-hidden">
          {/* Dados */}
          <div className="md:overflow-y-auto scroll-thin p-5 flex flex-col gap-5" style={{ borderRight: "1px solid var(--line)" }}>
            <section>
              <div className="eyebrow mb-3">Dados da paciente</div>
              <div className="grid grid-cols-2 gap-3">
                <Campo id="f-tel" label="WhatsApp"><input id="f-tel" className="field" value={l.tel} onChange={(e) => set({ tel: e.target.value })} inputMode="tel" placeholder="(51) 99999-0000" /></Campo>
                <Campo id="f-email" label="E-mail"><input id="f-email" className="field" value={l.email} onChange={(e) => set({ email: e.target.value })} type="email" /></Campo>
                <Campo id="f-nasc" label="Nascimento"><input id="f-nasc" className="field" type="date" value={l.nascimento} onChange={(e) => set({ nascimento: e.target.value })} /></Campo>
                <Campo id="f-cid" label="Cidade"><input id="f-cid" className="field" value={l.cidade} onChange={(e) => set({ cidade: e.target.value })} /></Campo>
                <Campo id="f-orig" label="Origem"><select id="f-orig" className="field" value={l.origem} onChange={(e) => set({ origem: e.target.value })}>{ORIGENS.map((o) => <option key={o}>{o}</option>)}</select></Campo>
                <Campo id="f-int" label="Interesse"><select id="f-int" className="field" value={l.interesse} onChange={(e) => set({ interesse: e.target.value })}>{INTERESSES.map((o) => <option key={o}>{o}</option>)}</select></Campo>
                <Campo id="f-valor" label="Valor do protocolo (R$)"><input id="f-valor" className="field num" type="number" min={0} step={100} value={l.valor || ""} onChange={(e) => set({ valor: Number(e.target.value) || 0 })} placeholder="0" /></Campo>
                <Campo id="f-mod" label="Modalidade"><select id="f-mod" className="field" value={l.modalidade} onChange={(e) => set({ modalidade: e.target.value as Lead["modalidade"] })}><option>Presencial</option><option>Online</option></select></Campo>
              </div>
              {l.tel && (
                <a className="inline-flex mt-3 text-[13px] font-medium" style={{ color: "var(--gold-ink)" }} target="_blank" rel="noopener" href={`https://wa.me/55${l.tel.replace(/\D/g, "")}`}>Abrir no WhatsApp ↗</a>
              )}
            </section>

            <section>
              <div className="eyebrow mb-3">Consulta</div>
              <div className="flex flex-wrap items-end gap-3">
                <Campo id="f-cons" label="Data e hora">
                  <input id="f-cons" type="datetime-local" className="field !w-auto" value={toLocal(l.consulta)}
                    onChange={(e) => {
                      const t = e.target.value ? new Date(e.target.value).getTime() : null;
                      update(l.id, { consulta: t, ...(t && l.etapa !== "agendado" ? { etapa: "agendado", mov: Date.now() } : {}) },
                        t ? { t: Date.now(), tipo: "consulta", texto: `Consulta marcada para ${data(t)} às ${hora(t)}` } : undefined);
                    }} />
                </Campo>
                {l.consulta && <span className="text-[12.5px] pb-2.5" style={{ color: "var(--ok)" }}>Marcar data move para Agendado</span>}
              </div>
            </section>

            <section>
              <div className="eyebrow mb-3">Etiquetas</div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <AnimatePresence>
                  {l.tags.map((t) => (
                    <motion.span key={t} layout initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
                      <TagChip nome={t} onRemove={() => set({ tags: l.tags.filter((x) => x !== t) })} />
                    </motion.span>
                  ))}
                </AnimatePresence>
                {l.tags.length === 0 && <span className="text-[12.5px]" style={{ color: "var(--muted)" }}>Nenhuma etiqueta ainda.</span>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {semTag.map((t) => (
                  <button key={t.nome} type="button" className="chip cursor-pointer hover:!border-[var(--gold)]"
                    onClick={() => update(l.id, { tags: [...l.tags, t.nome] }, { t: Date.now(), tipo: "tag", texto: `Etiqueta ${t.nome}` })}>
                    <Plus size={11} />{t.nome}
                  </button>
                ))}
              </div>
              <form className="flex gap-2 mt-3 items-center" onSubmit={(e) => {
                e.preventDefault(); const n = novaTag.trim(); if (!n) return;
                criarTag({ nome: n, cor: corTag }); if (!l.tags.includes(n)) update(l.id, { tags: [...l.tags, n] }, { t: Date.now(), tipo: "tag", texto: `Etiqueta ${n}` }); setNovaTag("");
              }}>
                <input id="f-novatag" className="field !py-1.5" placeholder="Nova etiqueta" value={novaTag} onChange={(e) => setNovaTag(e.target.value)} aria-label="Nova etiqueta" />
                <div className="flex gap-1" role="radiogroup" aria-label="Cor da etiqueta">
                  {TAG_CORES.map((c) => (
                    <button key={c} type="button" role="radio" aria-checked={corTag === c} aria-label={c} onClick={() => setCorTag(c)}
                      className={`tag-${c} w-5 h-5 rounded-full cursor-pointer`} style={{ outline: corTag === c ? "2px solid var(--gold)" : "none", outlineOffset: 1 }} />
                  ))}
                </div>
                <button type="submit" className="btn !py-1.5">Criar</button>
              </form>
            </section>

            <section>
              <div className="eyebrow mb-3">Pendência para a Dra</div>
              {l.dra && !l.dra.feito ? (
                <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--gold-soft)" }}>
                  <Stethoscope size={17} style={{ color: "var(--gold-ink)" }} />
                  <span className="flex-1">{l.dra.texto}<span className="block text-[12px]" style={{ color: "var(--muted)" }}>Aberta {quando(l.dra.em)}</span></span>
                  <button type="button" className="btn !py-1.5" onClick={() => update(l.id, { dra: { ...l.dra!, feito: true } }, ev("dra", `Dra resolveu: ${l.dra!.texto}`))}>Resolvida</button>
                </div>
              ) : (
                <form className="flex gap-2" onSubmit={(e) => {
                  e.preventDefault(); const inp = (e.currentTarget.elements.namedItem("f-dra") as HTMLInputElement); const v = inp.value.trim(); if (!v) return;
                  update(l.id, { dra: { texto: v, feito: false, em: Date.now() } }, ev("dra", `Pendência para a Dra: ${v}`)); inp.value = "";
                }}>
                  <input id="f-dra" name="f-dra" className="field" placeholder="Ex.: assinar receita, revisar exames" aria-label="Pendência para a Dra" />
                  <button type="submit" className="btn">Enviar</button>
                </form>
              )}
            </section>

            <section className="mt-auto pt-2">
              {apagar ? (
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="flex-1" style={{ color: "var(--bad)" }}>Excluir {l.nome || "esta paciente"} e todo o histórico?</span>
                  <button type="button" className="btn" onClick={() => setApagar(false)}>Cancelar</button>
                  <button type="button" className="btn" style={{ color: "var(--bad)", borderColor: "var(--bad)" }} onClick={() => { remover(l.id); onClose(); }}>Excluir</button>
                </div>
              ) : (
                <button type="button" className="btn btn-ghost !px-2" style={{ color: "var(--bad)" }} onClick={() => setApagar(true)}><Trash2 size={15} />Excluir paciente</button>
              )}
            </section>
          </div>

          {/* Histórico e conversa */}
          <div className="flex flex-col min-h-[480px] md:min-h-0">
            <div className="px-5 pt-4 pb-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--line)" }}>
              <Seg id="ficha-aba" value={aba} onChange={setAba} opcoes={[{ v: "hist", label: "Histórico" }, { v: "chat", label: `Conversa · ${l.msgs.length}` }]} />
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {aba === "hist" ? (
                <motion.div key="hist" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }}
                  className="flex-1 min-h-0 flex flex-col">
                  <form className="p-4 flex gap-2" style={{ borderBottom: "1px solid var(--line)" }} onSubmit={(e) => {
                    e.preventDefault(); const v = nota.trim(); if (!v) return; update(l.id, {}, ev("nota", v)); setNota("");
                  }}>
                    <input id="f-nota" className="field" placeholder="Anotar algo sobre a paciente…" value={nota} onChange={(e) => setNota(e.target.value)} aria-label="Nova anotação" />
                    <button type="submit" className="btn btn-gold">Anotar</button>
                  </form>
                  <ol className="flex-1 overflow-y-auto scroll-thin p-5 m-0 list-none flex flex-col">
                    <AnimatePresence initial={false}>
                      {timeline.map((h, i) => {
                        const I = ICONE[h.tipo];
                        return (
                          <motion.li key={`${h.t}-${i}`} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-[28px_1fr] gap-3 pb-4 relative">
                            {i < timeline.length - 1 && <span className="absolute left-[13.5px] top-7 bottom-0 w-px" style={{ background: "var(--line)" }} />}
                            <span className="w-7 h-7 rounded-full grid place-items-center relative" style={{ background: h.tipo === "nota" ? "var(--gold-soft)" : "var(--surface-2)", border: "1px solid var(--line)", color: "var(--gold-ink)" }}><I size={13} /></span>
                            <div className="min-w-0">
                              <div className={h.tipo === "nota" ? "text-[13.5px]" : "text-[13px]"}>{h.texto}</div>
                              <div className="text-[11.5px]" style={{ color: "var(--muted)" }}>{data(h.t)} · {hora(h.t)}</div>
                            </div>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ol>
                </motion.div>
              ) : (
                <motion.div key="chat" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }} className="flex-1 min-h-[420px] md:min-h-0">
                  <ChatThread l={l} compacto />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
