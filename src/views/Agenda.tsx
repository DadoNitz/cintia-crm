"use client";
import { AnimatePresence, motion } from "motion/react";
import { CalendarPlus, MapPin, Video } from "lucide-react";
import { useState } from "react";
import { Avatar, Cabecalho, Vazio } from "@/components/bits";
import { LembretesAmanha, consultasDoDia, hojeInicio, useRelogio } from "@/components/Hoje";
import { hora, quando } from "@/lib/fmt";
import { amanha, useCRM } from "@/lib/store";
import { DIA, TIPOS, type Lead } from "@/lib/types";
import { rectDe, useUI } from "@/lib/ui";

const STATUS = (l: Lead) =>
  l.fluxo === "atendida" ? { t: "Atendida", c: "tag-salvia" } :
  l.fluxo === "consulta" ? { t: "Em consulta", c: "tag-ouro" } :
  l.fluxo === "recepcao" ? { t: "Na recepção", c: "tag-terra" } :
  l.fluxo === "faltou" ? { t: "Faltou", c: "tag-rosa" } :
  l.confirmada ? { t: "Confirmada", c: "tag-ceu" } : { t: "Agendada", c: "tag-cinza" };

const SLOTS_DIA = 9 * 60 / 40; // 9h de atendimento, consulta média de 40 min

export function Agenda() {
  const { leads } = useCRM();
  const { abrirFicha, novoContato } = useUI();
  const agora = useRelogio();
  const h0 = hojeInicio();
  const dias = Array.from({ length: 14 }, (_, i) => h0 + i * DIA).filter((d) => ![0, 6].includes(new Date(d).getDay())).slice(0, 8);
  const [dia, setDia] = useState(dias[0]);
  const doDia = consultasDoDia(leads, dia);
  const [ini, fim] = amanha();
  const am = leads.filter((l) => l.consulta && l.consulta >= ini && l.consulta < fim);
  const ocupacao = Math.round((consultasDoDia(leads).length / SLOTS_DIA) * 100);
  const semData = leads.filter((l) => l.etapa === "agendar");

  const kpis = [
    { l: "Consultas hoje", v: consultasDoDia(leads).length },
    { l: "Ocupação da agenda", v: `${ocupacao}%` },
    { l: "Horários livres hoje", v: Math.max(0, Math.round(SLOTS_DIA) - consultasDoDia(leads).length) },
    { l: "Confirmadas amanhã", v: `${am.filter((l) => l.confirmada).length} de ${am.length}` },
  ];

  return (
    <div>
      <Cabecalho eyebrow="Agenda da Dra. Cintia" titulo="Agenda">
        <button type="button" className="btn btn-gold" onClick={novoContato}><CalendarPlus size={15} />Nova consulta</button>
      </Cabecalho>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {kpis.map((k) => <div key={k.l} className="panel p-4"><div className="eyebrow">{k.l}</div><div className="display text-[32px] leading-none mt-2 num">{k.v}</div></div>)}
      </div>

      <div className="flex gap-2 overflow-x-auto scroll-thin pb-2 mb-3" role="tablist" aria-label="Dia">
        {dias.map((d) => {
          const n = consultasDoDia(leads, d).length, sel = d === dia;
          return (
            <button key={d} type="button" role="tab" aria-selected={sel} onClick={() => setDia(d)} className="relative flex-none w-[84px] rounded-xl py-2.5 text-center cursor-pointer" style={{ border: "1px solid var(--line)", background: "var(--surface)" }}>
              {sel && <motion.span layoutId="dia-sel" className="absolute inset-0 rounded-xl" style={{ background: "var(--gold-btn)" }} transition={{ type: "spring", stiffness: 450, damping: 34 }} />}
              <span className="relative block text-[11px] uppercase tracking-wider" style={{ color: sel ? "var(--on-gold)" : "var(--muted)" }}>{d === h0 ? "Hoje" : new Date(d).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span>
              <span className="relative block display text-[24px] leading-tight" style={{ color: sel ? "var(--on-gold)" : "var(--ink)" }}>{new Date(d).getDate()}</span>
              <span className="relative block text-[11px]" style={{ color: sel ? "var(--on-gold)" : "var(--muted)" }}>{n} consulta{n === 1 ? "" : "s"}</span>
            </button>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_330px] gap-4 items-start">
        <section className="panel p-4 min-w-0">
          <div className="flex items-baseline gap-3 mb-3 px-1">
            <h2 className="display text-[22px] m-0 flex-1">{((s) => s[0].toUpperCase() + s.slice(1))(new Date(dia).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }))}</h2>
            <span className="text-[12.5px]" style={{ color: "var(--muted)" }}>Seg a sex · 9h às 18h</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.ol key={dia} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }} className="list-none m-0 p-0 relative">
              {doDia.map((l) => {
                const s = STATUS(l), passou = dia === h0 && l.consulta! + TIPOS[l.tipo] * 60e3 < agora;
                const agoraAqui = dia === h0 && l.consulta! <= agora && l.consulta! + TIPOS[l.tipo] * 60e3 > agora;
                return (
                  <li key={l.id} className="grid grid-cols-[56px_1fr] gap-3 relative">
                    <div className="text-right pt-3">
                      <div className="num font-medium text-[14px]" style={{ color: passou ? "var(--muted)" : "var(--gold-ink)" }}>{hora(l.consulta!)}</div>
                      <div className="text-[11px]" style={{ color: "var(--muted)" }}>{TIPOS[l.tipo]} min</div>
                    </div>
                    <div className="pb-2 relative" style={{ borderLeft: "1px solid var(--line)", paddingLeft: 14 }}>
                      <span className="absolute -left-[5px] top-4 w-[9px] h-[9px] rounded-full" style={{ background: agoraAqui ? "var(--gold-btn)" : passou ? "var(--line-2)" : "var(--surface)", border: "1.5px solid var(--gold)" }} />
                      {agoraAqui && <motion.span className="absolute -left-[9px] top-[12px] w-[17px] h-[17px] rounded-full" style={{ border: "1.5px solid var(--gold)" }} animate={{ scale: [1, 1.6], opacity: [0.8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} />}
                      <button type="button" onClick={(e) => abrirFicha(l.id, rectDe(e.currentTarget))}
                        className="w-full flex flex-wrap items-center gap-3 rounded-xl p-3 text-left cursor-pointer hover:bg-[var(--surface-2)]"
                        style={{ border: "1px solid var(--line)", opacity: l.fluxo === "faltou" ? 0.6 : 1 }}>
                        <Avatar nome={l.nome} size={32} />
                        <span className="flex-1 min-w-[140px]"><span className="block font-medium">{l.nome}</span><span className="text-[12px]" style={{ color: "var(--muted)" }}>{l.tipo} · {l.interesse}</span></span>
                        <span className="chip">{l.modalidade === "Online" ? <Video size={12} /> : <MapPin size={12} />}{l.modalidade}</span>
                        <span className={`tag ${s.c}`}>{s.t}</span>
                      </button>
                    </div>
                  </li>
                );
              })}
              {doDia.length === 0 && <Vazio>Nenhuma consulta neste dia.</Vazio>}
            </motion.ol>
          </AnimatePresence>
        </section>

        <div className="flex flex-col gap-3 xl:sticky xl:top-20">
          <LembretesAmanha />
          <section className="panel p-4">
            <div className="eyebrow mb-1">Falta marcar a data</div>
            <p className="text-[12.5px] mt-0 mb-3" style={{ color: "var(--muted)" }}>Fecharam o protocolo e esperam um horário.</p>
            <div className="flex flex-col gap-1">
              {semData.map((l) => (
                <button key={l.id} type="button" onClick={(e) => abrirFicha(l.id, rectDe(e.currentTarget))} className="flex items-center gap-2.5 rounded-xl p-2 text-left cursor-pointer hover:bg-[var(--surface-2)]">
                  <Avatar nome={l.nome} size={30} />
                  <span className="flex-1 min-w-0"><span className="block truncate font-medium text-[13.5px]">{l.nome}</span><span className="text-[12px]" style={{ color: "var(--muted)" }}>Esperando {quando(l.mov)}</span></span>
                  <span className="text-[12px] font-medium" style={{ color: "var(--gold-ink)" }}>Marcar</span>
                </button>
              ))}
              {semData.length === 0 && <Vazio>Todas com data marcada.</Vazio>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
