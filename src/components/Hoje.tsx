"use client";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { BellRing, Check, DoorOpen, LogIn, MapPin, Send, Stethoscope, Video, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, Vazio } from "@/components/bits";
import { hora } from "@/lib/fmt";
import { agoraClinica, amanha, useCRM } from "@/lib/store";
import type { Fluxo, Lead } from "@/lib/types";
import { rectDe, useUI } from "@/lib/ui";

export const hojeInicio = () => { const x = new Date(); x.setHours(0, 0, 0, 0); return x.getTime(); };
export const consultasDoDia = (leads: Lead[], d0 = hojeInicio()) =>
  leads.filter((l) => l.consulta && l.consulta >= d0 && l.consulta < d0 + 864e5).sort((a, b) => a.consulta! - b.consulta!);

// Atualiza "esperando há X min" a cada 20 s
export function useRelogio(ms = 20_000) {
  const [t, setT] = useState(agoraClinica);
  useEffect(() => { const i = setInterval(() => setT(agoraClinica()), ms); return () => clearInterval(i); }, [ms]);
  return t;
}

const COLUNAS: { id: Fluxo; nome: string }[] = [
  { id: "esperada", nome: "Esperadas" },
  { id: "recepcao", nome: "Na recepção" },
  { id: "consulta", nome: "Em consulta" },
  { id: "atendida", nome: "Atendidas" },
];

function CardFluxo({ l, agora }: { l: Lead; agora: number }) {
  const { avancarFluxo } = useCRM();
  const { abrirFicha } = useUI();
  const espera = l.chegada ? Math.max(0, Math.round((agora - l.chegada) / 60e3)) : 0;
  const atrasada = l.fluxo === "esperada" && l.consulta! < agora - 15 * 60e3;
  const acao: Record<Fluxo, { txt: string; prox: Fluxo; Icon: typeof LogIn } | null> = {
    esperada: { txt: "Check-in", prox: "recepcao", Icon: LogIn },
    recepcao: { txt: "Chamar", prox: "consulta", Icon: DoorOpen },
    consulta: { txt: "Finalizar", prox: "atendida", Icon: Check },
    atendida: null, faltou: null,
  };
  const a = acao[l.fluxo ?? "esperada"];
  return (
    <motion.div layout layoutId={`fluxo-${l.id}`} transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="rounded-xl p-2.5 flex flex-col gap-2" style={{ background: "var(--surface)", border: `1px solid ${atrasada ? "color-mix(in srgb, var(--warn) 45%, var(--line))" : "var(--line)"}` }}>
      <button type="button" className="flex items-center gap-2.5 text-left cursor-pointer min-w-0" onClick={(e) => abrirFicha(l.id, rectDe(e.currentTarget.parentElement))}>
        <Avatar nome={l.nome} size={28} />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium truncate">{l.nome}</span>
          <span className="flex items-center gap-1 text-[11.5px]" style={{ color: "var(--muted)" }}>
            {hora(l.consulta!)} · {l.tipo}{l.modalidade === "Online" && <Video size={11} />}
          </span>
        </span>
      </button>
      {l.fluxo !== "atendida" && (
        <div className="flex flex-wrap items-center gap-1.5">
          {l.fluxo === "esperada" && (
            atrasada ? <span className="text-[11px] font-medium" style={{ color: "var(--warn)" }}>Atrasada</span>
              : <span className={`tag ${l.confirmada ? "tag-salvia" : "tag-cinza"} !text-[10.5px]`}>{l.confirmada ? "Confirmada" : "Sem confirmar"}</span>
          )}
          {l.fluxo === "recepcao" && <span className="text-[11.5px] num" style={{ color: espera > 15 ? "var(--warn)" : "var(--muted)" }}>Esperando {espera} min</span>}
          {l.fluxo === "consulta" && <span className="text-[11.5px] flex items-center gap-1" style={{ color: "var(--muted)" }}>{l.modalidade === "Online" ? <Video size={11} /> : <MapPin size={11} />}{l.modalidade === "Online" ? "Videochamada" : "Consultório"}</span>}
          {atrasada && (
            <button type="button" className="btn !py-1 !px-2 text-[11.5px] ml-auto" onClick={() => avancarFluxo(l.id, "faltou")} aria-label={`Marcar falta de ${l.nome}`}><X size={12} />Faltou</button>
          )}
          {a && (
            <motion.button whileTap={{ scale: 0.92 }} type="button" className={`btn !py-1 !px-2.5 text-[12px] ml-auto ${l.fluxo === "recepcao" ? "btn-gold" : ""}`} onClick={() => avancarFluxo(l.id, a.prox)}>
              <a.Icon size={13} />{a.txt}
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function FluxoHoje() {
  const { leads } = useCRM();
  const agora = useRelogio();
  const doDia = consultasDoDia(leads).filter((l) => l.fluxo !== "faltou");
  const faltas = consultasDoDia(leads).filter((l) => l.fluxo === "faltou").length;
  return (
    <section className="panel p-4 min-w-0">
      <div className="flex items-center gap-3 mb-3 px-1">
        <h2 className="eyebrow !text-[var(--ink)] m-0 flex-1">Fluxo de pacientes · hoje</h2>
        {faltas > 0 && <span className="chip">{faltas} falta{faltas > 1 ? "s" : ""}</span>}
        <span className="text-[12px] num" style={{ color: "var(--muted)" }}>{doDia.length} consultas</span>
      </div>
      <LayoutGroup id="fluxo">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
          {COLUNAS.map((c) => {
            const cards = doDia.filter((l) => (l.fluxo ?? "esperada") === c.id);
            const visiveis = c.id === "atendida" ? cards.slice(-4) : cards;
            return (
              <div key={c.id} className="rounded-[14px] p-2 flex flex-col gap-2 min-h-[160px] min-w-0" style={{ background: "var(--surface-2)" }}>
                <div className="flex items-center justify-between px-1 pt-0.5">
                  <span className="text-[12px] font-medium">{c.nome}</span>
                  <motion.span key={cards.length} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="num text-[11.5px] px-1.5 rounded-full" style={{ background: "var(--surface)", color: "var(--muted)" }}>{cards.length}</motion.span>
                </div>
                <AnimatePresence mode="popLayout">
                  {visiveis.map((l) => <CardFluxo key={l.id} l={l} agora={agora} />)}
                </AnimatePresence>
                {cards.length > visiveis.length && <span className="text-[11.5px] px-1" style={{ color: "var(--muted)" }}>+{cards.length - visiveis.length} atendidas antes</span>}
                {cards.length === 0 && <span className="text-[11.5px] px-1 py-3 text-center" style={{ color: "var(--faint)" }}>Ninguém aqui</span>}
              </div>
            );
          })}
        </div>
      </LayoutGroup>
    </section>
  );
}

export function LembretesAmanha() {
  const { leads, enviarLembretes } = useCRM();
  const [ini, fim] = amanha();
  const am = leads.filter((l) => l.consulta && l.consulta >= ini && l.consulta < fim);
  const pendentes = am.filter((l) => l.optin === "sim" && !l.lembrete).length;
  const semWpp = am.filter((l) => l.optin !== "sim").length;
  const etapas = [
    { l: "Enviado", n: am.filter((l) => l.lembrete).length },
    { l: "Lido", n: am.filter((l) => l.lembrete === "lido" || l.lembrete === "confirmado").length },
    { l: "Confirmado", n: am.filter((l) => l.lembrete === "confirmado").length },
  ];
  const [enviados, setEnviados] = useState<number | null>(null);
  return (
    <section className="panel p-4 min-w-0">
      <div className="flex items-center gap-2 mb-1"><BellRing size={15} style={{ color: "var(--gold-ink)" }} /><h2 className="eyebrow !text-[var(--ink)] m-0">Lembretes · amanhã</h2></div>
      <p className="text-[12.5px] mt-0 mb-3" style={{ color: "var(--muted)" }}>{am.length} consultas amanhã. O lembrete pede para a paciente confirmar.</p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {etapas.map((e) => (
          <div key={e.l} className="rounded-xl p-2.5" style={{ background: "var(--surface-2)" }}>
            <motion.div key={e.n} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="display text-[26px] leading-none num">{e.n}</motion.div>
            <div className="text-[11.5px] mt-1" style={{ color: "var(--muted)" }}>{e.l}</div>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-gold w-full justify-center" disabled={!pendentes} style={{ opacity: pendentes ? 1 : 0.55 }}
        onClick={() => setEnviados(enviarLembretes())}>
        <Send size={15} />{pendentes ? `Enviar ${pendentes} lembrete${pendentes > 1 ? "s" : ""}` : enviados ? `${enviados} lembretes enviados` : "Todos os lembretes enviados"}
      </button>
      {semWpp > 0 && <p className="text-[11.5px] mt-2 mb-0" style={{ color: "var(--muted)" }}>{semWpp} sem consentimento do WhatsApp: ligar ou mandar por outro canal.</p>}
    </section>
  );
}

export function WhatsAppAguardando() {
  const { leads } = useCRM();
  const { abrirConversa, ir } = useUI();
  const lista = leads.filter((l) => !l.resolvida && l.msgs.length && l.msgs[l.msgs.length - 1].de === "p")
    .sort((a, b) => Number(b.urgente) - Number(a.urgente) || b.msgs[b.msgs.length - 1].t - a.msgs[a.msgs.length - 1].t).slice(0, 5);
  return (
    <section className="panel p-4 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <span className="dot" style={{ background: "#58B368" }} />
        <h2 className="eyebrow !text-[var(--ink)] m-0 flex-1">WhatsApp · esperando resposta</h2>
        <button type="button" className="text-[12px] cursor-pointer" style={{ color: "var(--gold-ink)" }} onClick={() => ir("conversas")}>Abrir conversas</button>
      </div>
      <div className="flex flex-col gap-1">
        {lista.map((l) => (
          <button key={l.id} type="button" onClick={() => abrirConversa(l.id)} className="flex items-center gap-2.5 p-2 rounded-xl text-left cursor-pointer hover:bg-[var(--surface-2)]">
            <Avatar nome={l.nome} size={30} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5"><span className="font-medium text-[13px] truncate">{l.nome}</span>{l.urgente && <span className="tag tag-rosa !text-[10px] !py-0">Urgente</span>}</span>
              <span className="block text-[12px] truncate" style={{ color: "var(--muted)" }}>{l.msgs[l.msgs.length - 1].texto}</span>
            </span>
            {l.naoLidas > 0 && <span className="badge">{l.naoLidas}</span>}
          </button>
        ))}
        {lista.length === 0 && <Vazio>Ninguém esperando resposta.</Vazio>}
      </div>
      {lista.some((l) => l.responsavel === "dra") && (
        <p className="text-[11.5px] mt-2 mb-0 flex items-center gap-1" style={{ color: "var(--muted)" }}><Stethoscope size={12} />Algumas estão com a Dra.</p>
      )}
    </section>
  );
}
