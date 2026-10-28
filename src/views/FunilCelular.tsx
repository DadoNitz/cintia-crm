"use client";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { parado } from "@/lib/fmt";
import { useCRM } from "@/lib/store";
import { ETAPAS, etapa, type EtapaId, type Lead } from "@/lib/types";
import { rectDe, useUI } from "@/lib/ui";
import { CardFace } from "./Funil";

const LIMITE = 96; // px de arrasto para mudar de etapa

// No celular o kanban vira uma etapa por vez. Arrastar o card para a direita avança a etapa, para a esquerda volta.
// O card segue o dedo com elasticidade e, se não passar do limite, volta com mola para o lugar.
function CardDeslizavel({ l, onMover }: { l: Lead; onMover: (l: Lead, dir: 1 | -1) => void }) {
  const { abrirFicha } = useUI();
  const x = useMotionValue(0);
  const i = ETAPAS.findIndex((e) => e.id === l.etapa);
  const prox = ETAPAS[i + 1], ant = ETAPAS[i - 1];
  const rotate = useTransform(x, [-200, 0, 200], [-4, 0, 4]);
  const opDir = useTransform(x, [20, LIMITE], [0, 1]);
  const opEsq = useTransform(x, [-LIMITE, -20], [1, 0]);
  const passou = useRef(false);
  const arrastou = useRef(false); // o onTap do motion também dispara no fim de um arrasto curto
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.li layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      variants={{ sai: (dir: number) => ({ x: dir * 420, opacity: 0, rotate: dir * 8, transition: { type: "spring", stiffness: 260, damping: 26 } }) }} exit="sai"
      className="relative list-none">
      {/* O que aparece por baixo do card enquanto ele é arrastado */}
      <div className="absolute inset-0 rounded-[14px] flex items-center justify-between px-4 text-[12.5px] font-medium" style={{ background: "var(--gold-soft)" }} aria-hidden>
        <motion.span style={{ opacity: opDir, color: "var(--gold-ink)" }} className="flex items-center gap-1">{prox && <>{prox.curto}<ChevronRight size={15} /></>}</motion.span>
        <motion.span style={{ opacity: opEsq, color: "var(--gold-ink)" }} className="flex items-center gap-1">{ant && <><ChevronLeft size={15} />{ant.curto}</>}</motion.span>
      </div>
      <motion.div ref={ref} drag="x" dragDirectionLock dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: ant ? 0.7 : 0.12, right: prox ? 0.7 : 0.12 }}
        style={{ x, rotate, touchAction: "pan-y" }} whileTap={{ scale: 0.985 }}
        onPointerDown={() => { arrastou.current = false; }}
        onDragStart={() => { arrastou.current = true; }}
        onDrag={(_, info: PanInfo) => {
          const alem = Math.abs(info.offset.x) > LIMITE;
          if (alem !== passou.current) { passou.current = alem; if (alem && navigator.vibrate) navigator.vibrate(8); }
        }}
        onDragEnd={(_, info: PanInfo) => {
          passou.current = false;
          const forte = Math.abs(info.velocity.x) > 650;
          if ((info.offset.x > LIMITE || (forte && info.velocity.x > 0)) && prox) onMover(l, 1);
          else if ((info.offset.x < -LIMITE || (forte && info.velocity.x < 0)) && ant) onMover(l, -1);
        }}
        onTap={() => { if (!arrastou.current) abrirFicha(l.id, rectDe(ref.current)); }}
        className="relative cursor-grab active:cursor-grabbing" role="button" aria-label={`${l.nome}. Toque para abrir a ficha, deslize para mudar de etapa`}>
        <CardFace l={l} />
      </motion.div>
    </motion.li>
  );
}

export function FunilCelular() {
  const { leads, mover } = useCRM();
  const [sel, setSel] = useState<EtapaId>("novo");
  const [q, setQ] = useState("");
  const [dir, setDir] = useState<1 | -1>(1);
  const [aviso, setAviso] = useState<string | null>(null);
  const abas = useRef<HTMLDivElement>(null);

  useEffect(() => {
    abas.current?.querySelector<HTMLElement>(`[data-et="${sel}"]`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [sel]);
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(null), 2200); return () => clearTimeout(t); }, [aviso]);

  const busca = (l: Lead) => !q || l.nome.toLowerCase().includes(q.toLowerCase()) || l.tel.includes(q);
  const cards = useMemo(() => leads.filter((l) => l.etapa === sel && busca(l)).sort((a, b) => a.mov - b.mov),
    [leads, sel, q]);

  const onMover = (l: Lead, d: 1 | -1) => {
    const i = ETAPAS.findIndex((e) => e.id === l.etapa), alvo = ETAPAS[i + d];
    if (!alvo) return;
    setDir(d);
    mover(l.id, alvo.id);
    setAviso(`${l.nome.split(" ")[0]} → ${alvo.nome}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="eyebrow mb-1">Deslize o card para mudar de etapa</div>
        <h1 className="display text-[32px] leading-none m-0">Funil de <em style={{ color: "var(--gold-ink)" }}>pacientes</em></h1>
      </div>
      <label className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
        <input id="funil-busca-m" className="field !pl-9" placeholder="Buscar paciente" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar paciente" />
      </label>

      <div ref={abas} className="sticky z-10 -mx-4 px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar" role="tablist" aria-label="Etapas"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 64px)", background: "color-mix(in srgb, var(--bg) 92%, transparent)", backdropFilter: "blur(8px)" }}>
        {ETAPAS.map((e) => {
          const n = leads.filter((l) => l.etapa === e.id && busca(l)).length, ativo = sel === e.id;
          const frios = leads.filter((l) => l.etapa === e.id && parado(l)).length;
          return (
            <button key={e.id} data-et={e.id} type="button" role="tab" aria-selected={ativo} onClick={() => setSel(e.id)}
              className="relative flex-none flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] cursor-pointer" style={{ color: ativo ? "var(--on-gold)" : "var(--ink)", border: "1px solid var(--line)", background: "var(--surface)" }}>
              {ativo && <motion.span layoutId="etapa-m" className="absolute inset-0 rounded-full" style={{ background: "var(--gold-btn)" }} transition={{ type: "spring", stiffness: 480, damping: 36 }} />}
              <span className="relative dot" style={{ background: ativo ? "var(--on-gold)" : e.cor }} />
              <span className="relative whitespace-nowrap">{e.curto}</span>
              <span className="relative num text-[11.5px] opacity-80">{n}</span>
              {frios > 0 && !ativo && <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: "var(--warn)" }} title={`${frios} paradas`} />}
            </button>
          );
        })}
      </div>

      <p className="text-[12.5px] m-0 px-1" style={{ color: "var(--muted)" }}>{etapa(sel).hint}</p>

      <motion.ul key={sel} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 380, damping: 34 }}
        className="m-0 p-0 flex flex-col gap-2.5">
        <AnimatePresence custom={dir} mode="popLayout">
          {cards.map((l) => <CardDeslizavel key={l.id} l={l} onMover={onMover} />)}
        </AnimatePresence>
        {cards.length === 0 && (
          <li className="list-none text-center text-[13px] py-12 rounded-2xl" style={{ color: "var(--muted)", border: "1.5px dashed var(--line-2)" }}>Ninguém nesta etapa.</li>
        )}
      </motion.ul>

      {createPortal(<AnimatePresence>
        {aviso && (
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            className="fixed left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-full text-[13px] shadow-lg"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 78px)", background: "var(--ink)", color: "var(--bg)" }} role="status">
            {aviso}
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </div>
  );
}
