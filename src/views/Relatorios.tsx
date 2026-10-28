"use client";
import { motion } from "motion/react";
import { Download, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { Cabecalho, Seg } from "@/components/bits";
import { useCRM } from "@/lib/store";
import { DIA, INTERESSES } from "@/lib/types";

// Gerador determinístico: os números de exemplo são sempre os mesmos a cada visita.
function prng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const SEMANAS = 12, LIGOU = 6; // lembretes por WhatsApp ligados há 6 semanas
function semanas() {
  const r = prng(45813);
  const fimSemana = new Date(); fimSemana.setHours(0, 0, 0, 0); fimSemana.setDate(fimSemana.getDate() - fimSemana.getDay());
  return Array.from({ length: SEMANAS }, (_, i) => {
    const antes = i < SEMANAS - LIGOU;
    const agendadas = Math.round(44 + r() * 14 + i * 0.8);
    const taxa = antes ? 0.12 + r() * 0.05 : 0.035 + r() * 0.03;
    const faltas = Math.round(agendadas * taxa);
    return { inicio: fimSemana.getTime() - (SEMANAS - 1 - i) * 7 * DIA, agendadas, realizadas: agendadas - faltas, faltas, taxa: faltas / agendadas, antes };
  });
}

const fmtDia = (t: number) => new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
const pct = (x: number) => `${(x * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

function LinhaFaltas({ dados }: { dados: ReturnType<typeof semanas> }) {
  const W = 560, H = 190, P = { l: 34, r: 12, t: 14, b: 26 };
  const max = 0.2, x = (i: number) => P.l + (i / (dados.length - 1)) * (W - P.l - P.r), y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  const antes = dados.filter((d) => d.antes);
  const mediaAntes = antes.length ? antes.reduce((s, d) => s + d.taxa, 0) / antes.length : 0;
  const caminho = dados.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.taxa).toFixed(1)}`).join(" ");
  const area = `${caminho} L${x(dados.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const iLigou = dados.findIndex((d) => !d.antes);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Taxa de faltas por semana">
      {[0, 0.1, 0.2].map((g) => (
        <g key={g}><line x1={P.l} x2={W - P.r} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeDasharray={g ? "3 4" : "0"} />
          <text x={P.l - 6} y={y(g) + 3} fontSize="10" textAnchor="end" fill="var(--muted)">{g * 100}%</text></g>
      ))}
      {mediaAntes > 0 && <><line x1={P.l} x2={W - P.r} y1={y(mediaAntes)} y2={y(mediaAntes)} stroke="var(--warn)" strokeDasharray="5 4" opacity=".7" />
        <text x={W - P.r} y={y(mediaAntes) - 5} fontSize="10" textAnchor="end" fill="var(--warn)">média antes: {pct(mediaAntes)}</text></>}
      {iLigou > 0 && <g><line x1={x(iLigou) - 0.5 * (x(1) - x(0))} x2={x(iLigou) - 0.5 * (x(1) - x(0))} y1={P.t} y2={y(0)} stroke="var(--gold)" />
        <text x={x(iLigou) - 0.5 * (x(1) - x(0)) + 5} y={P.t + 10} fontSize="10" fill="var(--gold-ink)">Lembretes ligados</text></g>}
      <motion.path d={area} fill="color-mix(in srgb, var(--gold) 14%, transparent)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} />
      <motion.path d={caminho} fill="none" stroke="var(--gold-btn)" strokeWidth="2.2" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: "easeInOut" }} />
      {dados.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.taxa)} r={i === dados.length - 1 ? 4.5 : 2.5} fill={i === dados.length - 1 ? "var(--gold-btn)" : "var(--surface)"} stroke="var(--gold-btn)" strokeWidth="1.5" />)}
      {dados.map((d, i) => (i % 2 === 0 || i === dados.length - 1) && <text key={`t${i}`} x={x(i)} y={H - 8} fontSize="10" textAnchor={i === dados.length - 1 ? "end" : i === 0 ? "start" : "middle"} fill="var(--muted)">{fmtDia(d.inicio)}</text>)}
    </svg>
  );
}

function Barras({ dados }: { dados: ReturnType<typeof semanas> }) {
  const W = 560, H = 170, P = { l: 30, r: 8, t: 10, b: 24 }, max = 70;
  const bw = (W - P.l - P.r) / dados.length;
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Consultas agendadas e realizadas por semana">
      {[0, 35, 70].map((g) => <g key={g}><line x1={P.l} x2={W - P.r} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeDasharray={g ? "3 4" : "0"} /><text x={P.l - 6} y={y(g) + 3} fontSize="10" textAnchor="end" fill="var(--muted)">{g}</text></g>)}
      {dados.map((d, i) => {
        const x0 = P.l + i * bw + bw * 0.18, w = bw * 0.64;
        return (
          <g key={i}>
            <motion.rect x={x0} width={w} rx="3" style={{ fill: "color-mix(in srgb, var(--gold) 22%, var(--surface))" }}
              initial={{ y: y(0), height: 0 }} animate={{ y: y(d.agendadas), height: y(0) - y(d.agendadas) }} transition={{ delay: i * 0.03, type: "spring", stiffness: 130, damping: 18 }} />
            <motion.rect x={x0 + w * 0.2} width={w * 0.6} rx="2.5" fill="var(--gold-btn)"
              initial={{ y: y(0), height: 0 }} animate={{ y: y(d.realizadas), height: y(0) - y(d.realizadas) }} transition={{ delay: 0.15 + i * 0.03, type: "spring", stiffness: 130, damping: 18 }} />
            {(i % 2 === 1 || i === dados.length - 1) && <text x={x0 + w / 2} y={H - 7} fontSize="10" textAnchor="middle" fill="var(--muted)">{fmtDia(d.inicio)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function Mapa() {
  const r = prng(2026);
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex"], horas = [9, 10, 11, 12, 13, 14, 15, 16, 17];
  const v = dias.map((_, di) => horas.map((h) => h === 12 ? 0 : Math.round(4 + r() * 10 + (h >= 14 && h <= 16 ? 4 : 0) + (di === 0 || di === 4 ? -2 : 0))));
  const max = Math.max(...v.flat());
  return (
    <div className="overflow-x-auto">
      <table className="border-separate text-[11px]" style={{ borderSpacing: 4 }} aria-label="Consultas por dia da semana e hora">
        <thead><tr><th />{horas.map((h) => <th key={h} className="font-normal px-1" style={{ color: "var(--muted)" }}>{h}h</th>)}</tr></thead>
        <tbody>
          {dias.map((d, i) => (
            <tr key={d}>
              <th className="font-normal pr-2 text-left" style={{ color: "var(--muted)" }}>{d}</th>
              {v[i].map((n, j) => (
                <td key={j} title={`${d} ${horas[j]}h: ${n} consultas`}>
                  <motion.div className="w-8 h-7 rounded-md grid place-items-center num" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (i * 9 + j) * 0.008 }}
                    style={{ background: n ? `color-mix(in srgb, var(--gold) ${Math.round((n / max) * 85) + 8}%, var(--surface-2))` : "var(--surface-2)", color: n / max > 0.6 ? "var(--on-gold)" : "var(--muted)" }}>{n || ""}</motion.div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Relatorios() {
  const { leads } = useCRM();
  const [per, setPer] = useState<"4" | "12">("12");
  const todas = useMemo(semanas, []);
  const dados = todas.slice(-Number(per));
  const depois = dados.filter((d) => !d.antes), antes = todas.filter((d) => d.antes);
  const taxa = (xs: typeof dados) => xs.reduce((s, d) => s + d.faltas, 0) / Math.max(1, xs.reduce((s, d) => s + d.agendadas, 0));
  const realizadas = dados.reduce((s, d) => s + d.realizadas, 0);
  const lembretes = Math.round(depois.reduce((s, d) => s + d.agendadas, 0) * 0.92);
  const funilLem = [["Enviados", lembretes], ["Entregues", Math.round(lembretes * 0.97)], ["Lidos", Math.round(lembretes * 0.86)], ["Confirmados", Math.round(lembretes * 0.7)]] as const;

  // Funil de vendas com os dados reais do CRM
  const contatos = leads.length;
  const conversaram = leads.filter((l) => l.etapa !== "novo").length;
  const proposta = leads.filter((l) => ["protocolo", "retorno", "agendar", "agendado"].includes(l.etapa)).length;
  const agendaram = leads.filter((l) => l.etapa === "agendado").length;
  const funilVendas = [["Entraram em contato", contatos], ["Conversaram", conversaram], ["Receberam proposta", proposta], ["Agendaram", agendaram]] as const;

  const mix = INTERESSES.map((i) => ({ i, n: leads.filter((l) => l.interesse === i).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
  const totalMix = mix.reduce((s, x) => s + x.n, 0);

  const csv = () => {
    const linhas = [["Semana", "Agendadas", "Realizadas", "Faltas", "Taxa de faltas"], ...dados.map((d) => [fmtDia(d.inicio), d.agendadas, d.realizadas, d.faltas, pct(d.taxa)])];
    const url = URL.createObjectURL(new Blob(["﻿" + linhas.map((l) => l.join(";")).join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "relatorio-consultas.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const kpis = [
    { l: "Consultas realizadas", v: realizadas.toLocaleString("pt-BR"), d: `nas últimas ${per} semanas` },
    { l: "Taxa de faltas", v: pct(taxa(depois.length ? depois : dados)), d: `era ${pct(taxa(antes))} antes dos lembretes`, bom: true },
    { l: "Resposta no WhatsApp", v: "9 min", d: "tempo mediano em horário comercial" },
    { l: "Lembretes confirmados", v: "70%", d: "das pacientes confirmam pelo botão" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Cabecalho eyebrow={`${fmtDia(dados[0].inicio)} – ${fmtDia(Date.now())} · últimas ${per} semanas`} titulo="Relatórios">
        <Seg id="rel-per" value={per} onChange={setPer} opcoes={[{ v: "4", label: "4 semanas" }, { v: "12", label: "12 semanas" }]} />
        <button type="button" className="btn" onClick={csv}><Download size={15} />Exportar CSV</button>
      </Cabecalho>
      <p className="text-[12.5px] -mt-3 mb-0 flex items-center gap-1.5" style={{ color: "var(--muted)" }}><Info size={13} />Agenda e faltas com números de exemplo. O funil de vendas e os interesses usam os dados do CRM.</p>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <motion.div key={k.l} className="panel p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="eyebrow">{k.l}</div>
            <div className="display text-[36px] leading-none mt-2 num">{k.v}</div>
            <div className="text-[12.5px] mt-1" style={{ color: k.bom ? "var(--ok)" : "var(--muted)" }}>{k.d}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
        <section className="panel p-5 min-w-0">
          <h2 className="eyebrow !text-[var(--ink)] m-0 mb-1">Faltas por semana</h2>
          <p className="text-[12.5px] mt-0 mb-3" style={{ color: "var(--muted)" }}>O lembrete sai na véspera com botão de confirmar. Quem não pode avisa antes e o horário volta para a agenda.</p>
          <LinhaFaltas dados={dados} />
        </section>
        <section className="panel p-5 min-w-0">
          <h2 className="eyebrow !text-[var(--ink)] m-0 mb-4">Funil dos lembretes</h2>
          <div className="flex flex-col gap-3">
            {funilLem.map(([nome, n], i) => (
              <div key={nome}>
                <div className="flex justify-between text-[13px] mb-1"><span>{nome}</span><span className="num" style={{ color: "var(--muted)" }}>{n.toLocaleString("pt-BR")} · {lembretes ? Math.round((n / lembretes) * 100) : 0}%</span></div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: i === 3 ? "var(--gold-btn)" : "color-mix(in srgb, var(--gold) 55%, var(--surface))" }}
                    initial={{ width: 0 }} animate={{ width: `${lembretes ? (n / lembretes) * 100 : 0}%` }} transition={{ delay: i * 0.08, type: "spring", stiffness: 110, damping: 20 }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
        <section className="panel p-5 min-w-0">
          <div className="flex flex-wrap items-baseline gap-3 mb-3"><h2 className="eyebrow !text-[var(--ink)] m-0 flex-1">Consultas por semana</h2>
            <span className="text-[12px] flex items-center gap-1.5" style={{ color: "var(--muted)" }}><span className="dot" style={{ background: "color-mix(in srgb, var(--gold) 22%, var(--surface))", border: "1px solid var(--line-2)" }} />Agendadas<span className="dot ml-2" style={{ background: "var(--gold-btn)" }} />Realizadas</span></div>
          <Barras dados={dados} />
        </section>
        <section className="panel p-5 min-w-0">
          <h2 className="eyebrow !text-[var(--ink)] m-0 mb-4">Funil de vendas · dados do CRM</h2>
          <div className="flex flex-col gap-2">
            {funilVendas.map(([nome, n], i) => (
              <motion.div key={nome} className="rounded-xl px-3 py-2.5 flex items-center justify-between text-[13px]"
                style={{ background: i === 3 ? "var(--gold-btn)" : `color-mix(in srgb, var(--gold) ${12 + i * 14}%, var(--surface))`, color: i === 3 ? "var(--on-gold)" : "var(--ink)", marginInline: `${i * 5}%` }}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                <span>{nome}</span><span className="num font-medium">{n} {i > 0 && contatos ? <span className="font-normal opacity-80">· {Math.round((n / contatos) * 100)}%</span> : null}</span>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <section className="panel p-5 min-w-0">
          <h2 className="eyebrow !text-[var(--ink)] m-0 mb-4">Procura por área</h2>
          <div className="flex h-4 rounded-full overflow-hidden mb-4">
            {mix.map((x, i) => <motion.div key={x.i} title={`${x.i}: ${x.n}`} style={{ background: `color-mix(in srgb, var(--gold) ${90 - i * 11}%, var(--surface))` }} initial={{ width: 0 }} animate={{ width: `${(x.n / totalMix) * 100}%` }} transition={{ delay: i * 0.05 }} />)}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
            {mix.map((x, i) => (
              <div key={x.i} className="flex items-center gap-2 min-w-0"><span className="dot" style={{ background: `color-mix(in srgb, var(--gold) ${90 - i * 11}%, var(--surface))` }} /><span className="truncate flex-1">{x.i}</span><span className="num" style={{ color: "var(--muted)" }}>{Math.round((x.n / totalMix) * 100)}%</span></div>
            ))}
          </div>
        </section>
        <section className="panel p-5 min-w-0">
          <h2 className="eyebrow !text-[var(--ink)] m-0 mb-3">Horários mais cheios</h2>
          <Mapa />
        </section>
      </div>
    </div>
  );
}
