"use client";
import { AnimatePresence, motion } from "motion/react";
import { Check, Stethoscope } from "lucide-react";
import { Avatar, Cabecalho, EtapaPill, Vazio } from "@/components/bits";
import { quando } from "@/lib/fmt";
import { useCRM } from "@/lib/store";
import type { Lead } from "@/lib/types";
import { rectDe, useUI } from "@/lib/ui";

function Item({ l }: { l: Lead }) {
  const { update } = useCRM();
  const { abrirFicha } = useUI();
  const feito = l.dra!.feito;
  const alternar = () => update(l.id, { dra: { ...l.dra!, feito: !feito } }, { t: Date.now(), tipo: "dra", texto: `${feito ? "Reaberta" : "Dra resolveu"}: ${l.dra!.texto}` });
  return (
    <motion.li layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className="panel p-4 flex items-center gap-4">
      <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={alternar} aria-pressed={feito} aria-label={feito ? "Reabrir pendência" : "Marcar como resolvida"}
        className="w-7 h-7 rounded-full grid place-items-center flex-none cursor-pointer"
        style={{ border: `1.5px solid ${feito ? "var(--ok)" : "var(--line-2)"}`, background: feito ? "var(--ok)" : "transparent", color: "#fff" }}>
        {feito && <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}><Check size={15} strokeWidth={3} /></motion.span>}
      </motion.button>
      <div className="flex-1 min-w-0">
        <div className="font-medium" style={{ textDecoration: feito ? "line-through" : "none", color: feito ? "var(--muted)" : "var(--ink)" }}>{l.dra!.texto}</div>
        <button type="button" className="flex items-center gap-2 mt-1 text-[12.5px] cursor-pointer" style={{ color: "var(--muted)" }} onClick={(e) => abrirFicha(l.id, rectDe(e.currentTarget.closest("li")))}>
          <Avatar nome={l.nome} size={20} />{l.nome} · {l.interesse}
        </button>
      </div>
      <div className="hidden sm:block"><EtapaPill id={l.etapa} /></div>
      <span className="text-[12px] w-20 text-right" style={{ color: "var(--muted)" }}>{quando(l.dra!.em)}</span>
    </motion.li>
  );
}

export function Pendencias() {
  const { leads } = useCRM();
  const abertas = leads.filter((l) => l.dra && !l.dra.feito).sort((a, b) => a.dra!.em - b.dra!.em);
  const feitas = leads.filter((l) => l.dra?.feito);
  return (
    <div className="max-w-[880px]">
      <Cabecalho eyebrow="O que a recepção precisa que a Dra resolva" titulo={<>Pendências da <em style={{ color: "var(--gold-ink)" }}>Dra. Cintia</em></>}>
        <span className="chip !text-[12.5px]"><Stethoscope size={13} />{abertas.length} abertas</span>
      </Cabecalho>
      <ul className="list-none p-0 m-0 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">{abertas.map((l) => <Item key={l.id} l={l} />)}</AnimatePresence>
      </ul>
      {abertas.length === 0 && <Vazio>Nada pendente. A Dra está em dia.</Vazio>}
      <h2 className="display text-[24px] mt-9 mb-3">Resolvidas</h2>
      <ul className="list-none p-0 m-0 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">{feitas.map((l) => <Item key={l.id} l={l} />)}</AnimatePresence>
      </ul>
      {feitas.length === 0 && <Vazio>As pendências resolvidas aparecem aqui. Abra a ficha de uma paciente para criar uma nova.</Vazio>}
    </div>
  );
}
