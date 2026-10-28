"use client";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { AlertCircle, ArrowUpRight, MessageCircle, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar, Seg, Vazio } from "@/components/bits";
import { FluxoHoje, LembretesAmanha, WhatsAppAguardando, consultasDoDia, useRelogio } from "@/components/Hoje";
import { aguardandoClinica, brl, dataLonga, dias, parado } from "@/lib/fmt";
import { useCRM } from "@/lib/store";
import { DIA, ETAPAS, ORIGENS } from "@/lib/types";
import { rectDe, useUI } from "@/lib/ui";

function Contador({ valor, sufixo = "" }: { valor: number; sufixo?: string }) {
  const mv = useMotionValue(0);
  const txt = useTransform(mv, (v) => Math.round(v).toLocaleString("pt-BR") + sufixo);
  useEffect(() => { const c = animate(mv, valor, { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }); return c.stop; }, [valor, mv]);
  return <motion.span className="num">{txt}</motion.span>;
}

const saudacao = () => { const h = new Date().getHours(); return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"; };

export function Painel() {
  const { leads } = useCRM();
  const { abrirFicha, ir, abrirConversa } = useUI();
  const [per, setPer] = useState<"7" | "30" | "90">("30");

  const p = Number(per), desde = Date.now() - p * DIA;
  const m = useMemo(() => {
    const ent = leads.filter((l) => l.criado >= desde);
    const ag = ent.filter((l) => l.etapa === "agendado");
    const negociacao = ent.filter((l) => ["receita", "protocolo", "retorno", "agendar"].includes(l.etapa));
    const potencial = leads.filter((l) => ["protocolo", "retorno", "agendar"].includes(l.etapa)).reduce((s, l) => s + l.valor, 0);
    return { ent, ag, negociacao, conv: ent.length ? Math.round((ag.length / ent.length) * 100) : 0, potencial };
  }, [leads, desde]);

  const atencao = leads.filter((l) => parado(l) || (aguardandoClinica(l) && l.naoLidas > 0)).sort((a, b) => a.mov - b.mov).slice(0, 6);
  const hoje0 = new Date(); hoje0.setHours(0, 0, 0, 0);
  const agora = useRelogio();
  const doDia = consultasDoDia(leads);
  const naRecepcao = doDia.filter((l) => l.fluxo === "recepcao");
  const esperaMedia = naRecepcao.length ? Math.round(naRecepcao.reduce((s, l) => s + Math.max(0, agora - (l.chegada ?? agora)), 0) / naRecepcao.length / 60e3) : 0;
  const wpp = leads.filter((l) => !l.resolvida && l.msgs.length && l.msgs[l.msgs.length - 1].de === "p");
  const topOrigem = [...ORIGENS].sort((a, b) => m.ent.filter((l) => l.origem === b).length - m.ent.filter((l) => l.origem === a).length).find((o) => m.ent.some((l) => l.origem === o));
  const pend = leads.filter((l) => l.dra && !l.dra.feito).length;

  // Contatos por dia (14 dias)
  const serie = Array.from({ length: 14 }, (_, i) => {
    const d0 = hoje0.getTime() - (13 - i) * DIA;
    return { d: d0, n: leads.filter((l) => l.criado >= d0 && l.criado < d0 + DIA).length };
  });
  const maxS = Math.max(2, ...serie.map((s) => s.n));
  const maxF = Math.max(1, ...ETAPAS.map((e) => leads.filter((l) => l.etapa === e.id).length));

  const kpis = [
    { l: "Conversão em agendamento", v: m.conv, suf: "%", d: `${m.ag.length} de ${m.ent.length} contatos em ${p} dias`, destaque: true },
    { l: "Consultas hoje", v: doDia.length, d: `${doDia.filter((l) => l.fluxo === "atendida").length} atendidas até agora`, acao: () => ir("agenda") },
    { l: "Na recepção", v: naRecepcao.length, d: naRecepcao.length ? `espera média de ${esperaMedia} min` : "ninguém esperando" },
    { l: "WhatsApp aguardando", v: wpp.length, d: `${pend} pendências com a Dra`, acao: () => ir("conversas") },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[240px]">
          <div className="eyebrow mb-1">{dataLonga(Date.now())}</div>
          <h1 className="display text-[38px] leading-[1.05] m-0">{saudacao()}, <em style={{ color: "var(--gold-ink)" }}>Ana</em></h1>
          <p className="m-0 mt-1" style={{ color: "var(--muted)" }}>
            {doDia.length} consultas hoje · {atencao.length > 0 ? `${atencao.length} pacientes do funil precisam de atenção.` : "funil em dia."} {brl(m.potencial)} em protocolos em negociação.
          </p>
        </div>
        <Seg id="periodo" value={per} onChange={setPer} opcoes={[{ v: "7", label: "7 dias" }, { v: "30", label: "30 dias" }, { v: "90", label: "90 dias" }]} />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <motion.button type="button" key={k.l} onClick={k.acao} disabled={!k.acao}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 26 }}
            whileHover={k.acao ? { y: -3 } : undefined}
            className="panel p-4 text-left flex flex-col gap-1 min-w-0"
            style={k.destaque ? { background: "var(--gold-btn)", borderColor: "var(--gold-btn)", color: "var(--on-gold)", cursor: "default" } : { cursor: k.acao ? "pointer" : "default" }}>
            <span className="eyebrow" style={k.destaque ? { color: "var(--on-gold)", opacity: 0.85 } : undefined}>{k.l}</span>
            <span className="display text-[44px] leading-none mt-1"><Contador valor={k.v} sufixo={k.suf} /></span>
            <span className="text-[12.5px]" style={{ color: k.destaque ? "var(--on-gold)" : "var(--muted)", opacity: k.destaque ? 0.85 : 1 }}>{k.d}</span>
          </motion.button>
        ))}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-3 items-start">
        <FluxoHoje />
        <div className="grid sm:grid-cols-2 xl:grid-cols-1 gap-3">
          <WhatsAppAguardando />
          <LembretesAmanha />
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-3">
        <section className="panel p-5 min-w-0">
          <div className="flex items-center justify-between mb-4"><h2 className="eyebrow !text-[var(--ink)] m-0">Precisam de atenção</h2>
            <button type="button" className="text-[12.5px] cursor-pointer flex items-center gap-1" style={{ color: "var(--gold-ink)" }} onClick={() => ir("funil")}>Ver funil<ArrowUpRight size={13} /></button></div>
          <div className="flex flex-col gap-1">
            {atencao.map((l) => (
              <div key={l.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface-2)]">
                <Avatar nome={l.nome} />
                <button type="button" className="flex-1 min-w-0 text-left cursor-pointer" onClick={(e) => abrirFicha(l.id, rectDe(e.currentTarget.parentElement))}>
                  <span className="block font-medium truncate">{l.nome}</span>
                  <span className="text-[12px] flex items-center gap-1" style={{ color: parado(l) ? "var(--warn)" : "var(--gold-ink)" }}>
                    {parado(l) ? <><AlertCircle size={12} />{ETAPAS.find((e) => e.id === l.etapa)!.nome} há {dias(l.mov)} dias</> : <><MessageCircle size={12} />Mandou mensagem e espera resposta</>}
                  </span>
                </button>
                <button type="button" className="btn !py-1.5 !px-3 text-[12.5px]" onClick={() => abrirConversa(l.id)}>Responder</button>
              </div>
            ))}
            {atencao.length === 0 && <Vazio>Nenhuma paciente esfriando. Ótimo trabalho.</Vazio>}
          </div>
        </section>
        <section className="panel p-5 min-w-0">
          <h2 className="eyebrow !text-[var(--ink)] m-0 mb-4">Onde cada paciente está</h2>
          <div className="flex flex-col gap-2.5">
            {ETAPAS.map((e, i) => {
              const n = leads.filter((l) => l.etapa === e.id).length;
              return (
                <button type="button" key={e.id} onClick={() => ir("funil")} className="grid grid-cols-[118px_1fr_26px] items-center gap-3 text-[13px] cursor-pointer text-left">
                  <span className="truncate">{e.nome}</span>
                  <span className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                    <motion.span className="block h-full rounded-full" style={{ background: e.cor }} initial={{ width: 0 }} animate={{ width: `${(n / maxF) * 100}%` }} transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 120, damping: 20 }} />
                  </span>
                  <span className="num text-right" style={{ color: "var(--muted)" }}>{n}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel p-5 min-w-0">
          <div className="flex items-baseline justify-between mb-4"><h2 className="eyebrow !text-[var(--ink)] m-0">Novos contatos por dia</h2><span className="text-[12px]" style={{ color: "var(--muted)" }}>14 dias</span></div>
          <svg viewBox="0 0 280 130" className="w-full h-auto" role="img" aria-label="Novos contatos por dia nos últimos 14 dias">
            {[0, 0.5, 1].map((g) => <line key={g} x1="0" x2="280" y1={10 + g * 100} y2={10 + g * 100} stroke="var(--line)" strokeDasharray={g === 1 ? "0" : "3 4"} />)}
            <text x="0" y="8" fontSize="9" fill="var(--muted)">{maxS}</text>
            {serie.map((s, i) => {
              const h = (s.n / maxS) * 100, x = i * 20 + 4;
              return (
                <g key={s.d}>
                  <motion.rect x={x} width="12" rx="3" fill={i === serie.length - 1 ? "var(--gold)" : "color-mix(in srgb, var(--gold) 45%, var(--surface))"}
                    initial={{ y: 110, height: 0 }} animate={{ y: 110 - h, height: h }} transition={{ delay: i * 0.03, type: "spring", stiffness: 140, damping: 18 }} />
                  {(i % 3 === 1 || i === 13) && <text x={x + 6} y="125" fontSize="8.5" textAnchor="middle" fill="var(--muted)">{new Date(s.d).getDate()}</text>}
                </g>
              );
            })}
          </svg>
        </section>

        <section className="panel p-5 min-w-0">
          <h2 className="eyebrow !text-[var(--ink)] m-0 mb-4">Conversão por origem</h2>
          <div className="flex flex-col gap-3">
            {ORIGENS.map((o) => {
              const t = m.ent.filter((l) => l.origem === o), a = t.filter((l) => l.etapa === "agendado").length;
              if (!t.length) return null;
              const pc = Math.round((a / t.length) * 100);
              return (
                <div key={o} className="text-[13px]">
                  <div className="flex justify-between mb-1"><span>{o}</span><span className="num" style={{ color: "var(--muted)" }}>{a}/{t.length} · {pc}%</span></div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                    <motion.div className="h-full rounded-full" style={{ background: "var(--gold)" }} initial={{ width: 0 }} animate={{ width: `${pc}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                  </div>
                </div>
              );
            })}
            {m.ent.length === 0 && <Vazio>Sem contatos no período.</Vazio>}
          </div>
          <p className="text-[12px] mt-4 mb-0 flex items-center gap-1.5" style={{ color: "var(--muted)" }}><Stethoscope size={13} />Maior origem no período: {topOrigem ?? "—"}.</p>
        </section>
      </div>
    </div>
  );
}
