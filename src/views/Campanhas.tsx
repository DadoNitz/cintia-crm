"use client";
import { AnimatePresence, motion } from "motion/react";
import { CalendarClock, FilePlus2, Megaphone, Pencil, Send, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Cabecalho, Seg, Vazio } from "@/components/bits";
import { data, hora } from "@/lib/fmt";
import { destinatarios, preencher, useCRM } from "@/lib/store";
import { ETAPAS, INTERESSES, etapa, type Campanha, type Modelo, type Publico } from "@/lib/types";

const STATUS: Record<Campanha["status"], { nome: string; cls: string }> = {
  rascunho: { nome: "Rascunho", cls: "tag-cinza" }, agendada: { nome: "Agendada", cls: "tag-ceu" },
  enviando: { nome: "Enviando…", cls: "tag-ouro" }, enviada: { nome: "Enviada", cls: "tag-salvia" },
};
const EXEMPLO: { nome: string; interesse: string; consulta: number | null } = { nome: "Camila Weber", interesse: "Emagrecimento", consulta: new Date().setHours(14, 0, 0, 0) };

export const descreverPublico = (p: Publico) => {
  const partes = [
    p.etapas.length ? p.etapas.map((e) => etapa(e).nome).join(", ") : "",
    p.tags.length ? `etiqueta ${p.tags.join(" ou ")}` : "",
    p.interesses.length ? p.interesses.join(", ") : "",
  ].filter(Boolean);
  return partes.length ? partes.join(" · ") : "Todas as pacientes";
};

export function BalaoModelo({ m, nome = EXEMPLO }: { m: Modelo; nome?: typeof EXEMPLO }) {
  return (
    <div className="rounded-[14px] p-3 text-[13px] leading-snug max-w-[340px]" style={{ background: "var(--gold-soft)", border: "1px solid color-mix(in srgb, var(--gold) 28%, transparent)", borderRadius: "14px 14px 4px 14px" }}>
      {m.titulo && <div className="font-semibold mb-1">{m.titulo}</div>}
      <div className="whitespace-pre-wrap">{preencher(m.texto, nome)}</div>
      {m.botao && <div className="mt-2.5 pt-2 text-center font-medium text-[12.5px]" style={{ borderTop: "1px solid color-mix(in srgb, var(--gold) 25%, transparent)", color: "var(--gold-ink)" }}>{m.botao}</div>}
    </div>
  );
}

function Funil({ m }: { m: NonNullable<Campanha["metricas"]> }) {
  const passos = [["Enviadas", m.enviadas], ["Entregues", m.entregues], ["Lidas", m.lidas], ["Responderam", m.respondidas], ["Agendaram", m.agendadas]] as const;
  return (
    <div className="grid grid-cols-5 gap-2">
      {passos.map(([nome, n], i) => {
        const pc = m.enviadas ? Math.round((n / m.enviadas) * 100) : 0;
        return (
          <div key={nome} className="min-w-0">
            <div className="h-16 rounded-lg flex items-end overflow-hidden" style={{ background: "var(--surface-2)" }}>
              <motion.div className="w-full rounded-lg" style={{ background: i === 4 ? "var(--gold-btn)" : "color-mix(in srgb, var(--gold) 55%, var(--surface))" }}
                initial={{ height: 0 }} animate={{ height: `${Math.max(pc, n ? 6 : 0)}%` }} transition={{ type: "spring", stiffness: 120, damping: 18, delay: i * 0.05 }} />
            </div>
            <div className="num font-medium mt-1.5 text-[14px]">{n}</div>
            <div className="text-[11px] truncate" style={{ color: "var(--muted)" }}>{nome} · {pc}%</div>
          </div>
        );
      })}
    </div>
  );
}

function CardCampanha({ c, onEditar }: { c: Campanha; onEditar: () => void }) {
  const { leads, modelos, dispararCampanha, salvarCampanha, removerCampanha } = useCRM();
  const m = modelos.find((x) => x.id === c.modelo);
  const d = destinatarios(leads, c.publico);
  const [apagar, setApagar] = useState(false);
  const enviada = c.status === "enviada" || c.status === "enviando";
  return (
    <motion.article layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="panel p-5 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-5">
      <div className="min-w-0 flex flex-col gap-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-[200px]">
            <h3 className="display text-[22px] m-0 leading-tight">{c.nome}</h3>
            <code className="text-[11.5px]" style={{ color: "var(--muted)" }}>{m?.nome ?? "modelo removido"}</code>
          </div>
          <span className={`tag ${STATUS[c.status].cls}`}>{STATUS[c.status].nome}</span>
        </div>
        <dl className="grid sm:grid-cols-3 gap-3 m-0 text-[13px]">
          <div><dt className="label">Público</dt><dd className="m-0">{descreverPublico(c.publico)}</dd></div>
          <div><dt className="label">Quando</dt><dd className="m-0">
            {c.status === "rascunho" ? "Não agendada" : c.quando ? `${data(c.quando)} às ${hora(c.quando)}` : "—"}
          </dd></div>
          <div><dt className="label">Destinatárias</dt><dd className="m-0">
            {enviada && c.metricas ? `${c.metricas.enviadas} enviadas` : `${d.ok.length} ${c.status === "rascunho" ? "se enviar agora" : "pacientes"}`}
            {!enviada && (d.pendente + d.recusou) > 0 && <span className="block text-[11.5px]" style={{ color: "var(--muted)" }}>{d.pendente + d.recusou} fora: sem consentimento do WhatsApp</span>}
          </dd></div>
        </dl>
        {enviada && c.metricas ? <Funil m={c.metricas} /> : (
          <div className="flex flex-wrap gap-2 mt-auto">
            {apagar ? (
              <>
                <span className="text-[13px] self-center" style={{ color: "var(--bad)" }}>Excluir esta campanha?</span>
                <button type="button" className="btn" onClick={() => setApagar(false)}>Cancelar</button>
                <button type="button" className="btn" style={{ color: "var(--bad)", borderColor: "var(--bad)" }} onClick={() => removerCampanha(c.id)}>Excluir</button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-gold" disabled={!d.ok.length || m?.status !== "Aprovado"} style={{ opacity: d.ok.length && m?.status === "Aprovado" ? 1 : 0.5 }} onClick={() => dispararCampanha(c.id)}>
                  <Send size={15} />Enviar agora
                </button>
                {c.status === "agendada" ? (
                  <button type="button" className="btn" onClick={() => salvarCampanha({ ...c, status: "rascunho", quando: null })}><X size={15} />Cancelar agendamento</button>
                ) : (
                  <button type="button" className="btn" onClick={onEditar}><Pencil size={15} />Editar</button>
                )}
                <button type="button" className="btn btn-ghost" onClick={() => setApagar(true)} aria-label="Excluir campanha"><Trash2 size={15} /></button>
              </>
            )}
            {m?.status === "Em análise" && <span className="text-[12px] self-center" style={{ color: "var(--warn)" }}>Modelo em análise pela Meta</span>}
          </div>
        )}
      </div>
      <div className="rounded-[16px] p-4 flex items-start justify-end" style={{ background: "radial-gradient(circle at 80% 0%, var(--gold-soft), transparent 60%), var(--surface-2)" }}>
        {m ? <BalaoModelo m={m} nome={d.ok[0] ?? EXEMPLO} /> : <Vazio>Modelo removido</Vazio>}
      </div>
    </motion.article>
  );
}

const vazio = (): Campanha => ({ id: `c${Date.now().toString(36)}`, nome: "", modelo: "novos_horarios", publico: { etapas: [], tags: [], interesses: [] }, status: "rascunho", quando: null, enviadaEm: null, metricas: null });
const toLocal = (t: number) => { const d = new Date(t); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

function Chips<T extends string>({ todas, sel, onChange, nome }: { todas: readonly T[]; sel: T[]; onChange: (v: T[]) => void; nome: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {todas.map((v) => {
        const on = sel.includes(v);
        return (
          <button key={v} type="button" aria-pressed={on} onClick={() => onChange(on ? sel.filter((x) => x !== v) : [...sel, v])}
            className="chip cursor-pointer" style={on ? { background: "var(--gold-soft)", borderColor: "var(--gold)", color: "var(--gold-ink)" } : undefined}>{nome(v)}</button>
        );
      })}
    </div>
  );
}

function Editor({ inicial, onClose }: { inicial: Campanha; onClose: () => void }) {
  const { leads, tags, modelos, salvarCampanha, dispararCampanha } = useCRM();
  const [c, setC] = useState(inicial);
  const [agendar, setAgendar] = useState(!!inicial.quando);
  const [quando, setQuando] = useState(inicial.quando ?? (() => { const x = new Date(); x.setDate(x.getDate() + 1); x.setHours(9, 0, 0, 0); return x.getTime(); })());
  const d = destinatarios(leads, c.publico);
  const m = modelos.find((x) => x.id === c.modelo);
  const pub = (p: Partial<Publico>) => setC({ ...c, publico: { ...c.publico, ...p } });
  const nome = c.nome.trim() || m?.titulo || "Nova campanha";
  return (
    <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center md:p-6" role="dialog" aria-modal="true" aria-label="Editar campanha">
      <motion.div className="absolute inset-0" style={{ background: "rgb(20 14 8 / .42)", backdropFilter: "blur(3px)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="relative w-full md:max-w-[980px] md:max-h-[92vh] h-full md:h-auto overflow-y-auto md:rounded-[22px] grid md:grid-cols-[minmax(0,1fr)_360px]"
        style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}
        initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 30 }}>
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3"><Megaphone size={18} style={{ color: "var(--gold-ink)" }} /><h2 className="display text-[26px] m-0 flex-1">{inicial.nome ? "Editar campanha" : "Nova campanha"}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar"><X size={16} /></button></div>
          <div><label className="label" htmlFor="camp-nome">Nome interno</label><input id="camp-nome" className="field" value={c.nome} placeholder="Ex.: Revisão de novembro" onChange={(e) => setC({ ...c, nome: e.target.value })} /></div>
          <div>
            <label className="label" htmlFor="camp-modelo">Modelo de mensagem</label>
            <select id="camp-modelo" className="field" value={c.modelo} onChange={(e) => setC({ ...c, modelo: e.target.value })}>
              {modelos.map((x) => <option key={x.id} value={x.id} disabled={x.status !== "Aprovado"}>{x.nome}{x.status !== "Aprovado" ? " (em análise)" : ""}</option>)}
            </select>
            <p className="text-[12px] mt-1.5 mb-0" style={{ color: "var(--muted)" }}>Para falar com quem não mandou mensagem nas últimas 24h, o WhatsApp exige um modelo aprovado pela Meta.</p>
          </div>
          <div className="flex flex-col gap-3">
            <span className="label !mb-0">Público</span>
            <div><span className="text-[12px] block mb-1.5" style={{ color: "var(--muted)" }}>Etapa do funil</span><Chips todas={ETAPAS.map((e) => e.id)} sel={c.publico.etapas} onChange={(v) => pub({ etapas: v })} nome={(v) => etapa(v).nome} /></div>
            <div><span className="text-[12px] block mb-1.5" style={{ color: "var(--muted)" }}>Etiquetas</span><Chips todas={tags.map((t) => t.nome)} sel={c.publico.tags} onChange={(v) => pub({ tags: v })} nome={(v) => v} /></div>
            <div><span className="text-[12px] block mb-1.5" style={{ color: "var(--muted)" }}>Interesse</span><Chips todas={INTERESSES} sel={c.publico.interesses as (typeof INTERESSES)[number][]} onChange={(v) => pub({ interesses: v })} nome={(v) => v} /></div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="label !mb-0">Quando</span>
            <Seg id="camp-quando" value={agendar ? "ag" : "ja"} onChange={(v) => setAgendar(v === "ag")} opcoes={[{ v: "ja", label: "Enviar agora" }, { v: "ag", label: "Agendar" }]} />
            {agendar && <input id="camp-data" type="datetime-local" className="field !w-auto" value={toLocal(quando)} onChange={(e) => e.target.value && setQuando(new Date(e.target.value).getTime())} />}
          </div>
        </div>
        <div className="p-6 flex flex-col gap-4" style={{ background: "var(--surface-2)", borderLeft: "1px solid var(--line)" }}>
          <div className="eyebrow">Prévia no WhatsApp</div>
          {m && <BalaoModelo m={m} nome={d.ok[0] ?? EXEMPLO} />}
          <div className="rounded-xl p-3 flex gap-3" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
            <Users size={18} style={{ color: "var(--gold-ink)" }} />
            <div className="text-[13px]">
              <motion.b key={d.ok.length} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="inline-block num">{d.ok.length}</motion.b> pacientes vão receber
              {(d.pendente + d.recusou) > 0 && <span className="block text-[12px]" style={{ color: "var(--muted)" }}>{d.pendente} com consentimento pendente e {d.recusou} que recusaram ficam de fora</span>}
            </div>
          </div>
          <p className="text-[12px] m-0 flex gap-1.5" style={{ color: "var(--muted)" }}><ShieldCheck size={14} className="flex-none mt-0.5" />Só recebe quem aceitou mensagens da clínica (LGPD e regras do WhatsApp).</p>
          <div className="mt-auto flex flex-col gap-2">
            <button type="button" className="btn btn-gold justify-center" disabled={!m || m.status !== "Aprovado" || !d.ok.length} style={{ opacity: m?.status === "Aprovado" && d.ok.length ? 1 : 0.5 }}
              onClick={() => {
                const final = { ...c, nome, status: agendar ? "agendada" as const : "rascunho" as const, quando: agendar ? quando : null };
                salvarCampanha(final);
                if (!agendar) dispararCampanha(final.id, final);
                onClose();
              }}>
              {agendar ? <><CalendarClock size={15} />Agendar envio</> : <><Send size={15} />Enviar para {d.ok.length}</>}
            </button>
            <button type="button" className="btn justify-center" onClick={() => { salvarCampanha({ ...c, nome, status: "rascunho", quando: null }); onClose(); }}>Salvar rascunho</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function EditorModelo({ onClose }: { onClose: () => void }) {
  const { salvarModelo } = useCRM();
  const [m, setM] = useState<Modelo>({ id: "", nome: "", categoria: "Marketing", status: "Em análise", titulo: "", texto: "Oi {{nome}}! ", botao: "" });
  const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
  const ok = m.nome && m.texto.trim().length > 10;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Novo modelo">
      <motion.div className="absolute inset-0" style={{ background: "rgb(20 14 8 / .42)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.form className="relative w-full max-w-[820px] max-h-[92vh] overflow-y-auto rounded-[22px] grid md:grid-cols-[minmax(0,1fr)_300px]" style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        onSubmit={(e) => {
          e.preventDefault(); if (!ok) return;
          const novo = { ...m, id: m.nome, botao: m.botao || undefined };
          salvarModelo(novo);
          // Demo: simula a aprovação da Meta alguns segundos depois
          setTimeout(() => salvarModelo({ ...novo, status: "Aprovado" }), 4000);
          onClose();
        }}>
        <div className="p-6 flex flex-col gap-4">
          <h2 className="display text-[26px] m-0">Novo modelo</h2>
          <div><label className="label" htmlFor="mod-nome">Nome</label><input id="mod-nome" className="field" placeholder="Ex.: convite live menopausa" onChange={(e) => setM({ ...m, nome: slug(e.target.value) })} />
            {m.nome && <code className="text-[11.5px]" style={{ color: "var(--muted)" }}>{m.nome}</code>}</div>
          <div><label className="label" htmlFor="mod-cat">Categoria</label>
            <select id="mod-cat" className="field" value={m.categoria} onChange={(e) => setM({ ...m, categoria: e.target.value as Modelo["categoria"] })}><option>Marketing</option><option>Utilidade</option></select>
            <p className="text-[12px] mt-1 mb-0" style={{ color: "var(--muted)" }}>Utilidade: lembretes e avisos. Marketing: novidades e convites (a Meta cobra mais caro por conversa).</p></div>
          <div><label className="label" htmlFor="mod-tit">Título (opcional)</label><input id="mod-tit" className="field" value={m.titulo} onChange={(e) => setM({ ...m, titulo: e.target.value })} /></div>
          <div><label className="label" htmlFor="mod-txt">Mensagem</label><textarea id="mod-txt" className="field" rows={4} value={m.texto} onChange={(e) => setM({ ...m, texto: e.target.value })} />
            <div className="flex gap-1.5 mt-1.5">{["{{nome}}", "{{interesse}}", "{{hora}}"].map((v) => (
              <button key={v} type="button" className="chip cursor-pointer" onClick={() => setM({ ...m, texto: m.texto + v })}>{v}</button>))}</div></div>
          <div><label className="label" htmlFor="mod-bot">Botão de resposta (opcional)</label><input id="mod-bot" className="field" value={m.botao} placeholder="Ex.: Quero agendar" onChange={(e) => setM({ ...m, botao: e.target.value })} /></div>
        </div>
        <div className="p-6 flex flex-col gap-4" style={{ background: "var(--surface-2)", borderLeft: "1px solid var(--line)" }}>
          <div className="eyebrow">Prévia</div>
          <BalaoModelo m={m} />
          <div className="mt-auto flex flex-col gap-2">
            <button type="submit" className="btn btn-gold justify-center" disabled={!ok} style={{ opacity: ok ? 1 : 0.5 }}><FilePlus2 size={15} />Enviar para aprovação</button>
            <button type="button" className="btn justify-center" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}

export function Campanhas() {
  const { campanhas, modelos } = useCRM();
  const [aba, setAba] = useState<"disparos" | "modelos">("disparos");
  const [editando, setEditando] = useState<Campanha | null>(null);
  const [novoModelo, setNovoModelo] = useState(false);
  const enviadas = campanhas.filter((c) => c.metricas);
  const soma = (k: keyof NonNullable<Campanha["metricas"]>) => enviadas.reduce((s, c) => s + (c.metricas?.[k] ?? 0), 0);
  const env = soma("enviadas");
  const kpis = [
    { l: "Mensagens enviadas", v: env.toLocaleString("pt-BR") },
    { l: "Taxa de leitura", v: env ? `${Math.round((soma("lidas") / env) * 100)}%` : "—" },
    { l: "Taxa de resposta", v: env ? `${Math.round((soma("respondidas") / env) * 100)}%` : "—" },
    { l: "Agendamentos via campanha", v: soma("agendadas").toLocaleString("pt-BR") },
  ];
  const ordem = { enviando: 0, agendada: 1, rascunho: 2, enviada: 3 };
  return (
    <div>
      <Cabecalho eyebrow="Disparos e modelos do WhatsApp" titulo="Campanhas">
        <button type="button" className="btn" onClick={() => setNovoModelo(true)}><FilePlus2 size={15} />Novo modelo</button>
        <button type="button" className="btn btn-gold" onClick={() => setEditando(vazio())}><Megaphone size={15} />Nova campanha</button>
      </Cabecalho>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {kpis.map((k) => <div key={k.l} className="panel p-4"><div className="eyebrow">{k.l}</div><div className="display text-[34px] leading-none mt-2 num">{k.v}</div></div>)}
      </div>
      <div className="mb-4"><Seg id="camp-aba" value={aba} onChange={setAba} opcoes={[{ v: "disparos", label: `Disparos · ${campanhas.length}` }, { v: "modelos", label: `Modelos · ${modelos.length}` }]} /></div>
      <AnimatePresence mode="wait">
        {aba === "disparos" ? (
          <motion.div key="d" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
            <AnimatePresence>{[...campanhas].sort((a, b) => ordem[a.status] - ordem[b.status] || (b.quando ?? 0) - (a.quando ?? 0)).map((c) => <CardCampanha key={c.id} c={c} onEditar={() => setEditando(c)} />)}</AnimatePresence>
            {campanhas.length === 0 && <Vazio>Nenhuma campanha ainda.</Vazio>}
          </motion.div>
        ) : (
          <motion.div key="m" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {modelos.map((m) => (
              <motion.article layout key={m.id} className="panel p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-[12px] flex-1 min-w-0 truncate">{m.nome}</code>
                  <span className="chip">{m.categoria}</span>
                  <motion.span key={m.status} initial={{ scale: 0.6 }} animate={{ scale: 1 }} className={`tag ${m.status === "Aprovado" ? "tag-salvia" : "tag-terra"}`}>{m.status}</motion.span>
                </div>
                <div className="rounded-xl p-3 flex-1" style={{ background: "var(--surface-2)" }}><BalaoModelo m={m} /></div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {/* No body: a transição de página usa transform/filter, que prendem position:fixed dentro dela */}
      {createPortal(
        <AnimatePresence>
          {editando && <Editor key="ed" inicial={editando} onClose={() => setEditando(null)} />}
          {novoModelo && <EditorModelo key="mod" onClose={() => setNovoModelo(false)} />}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
