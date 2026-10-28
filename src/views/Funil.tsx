"use client";
import { animate, motion, useMotionValue, useSpring, useTransform, useVelocity, type MotionValue } from "motion/react";
import { AlertCircle, CalendarClock, MessageCircle, Search, Stethoscope } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar, Cabecalho, TagChip } from "@/components/bits";
import { brl, data, dias, hora, parado, quando } from "@/lib/fmt";
import { useCRM } from "@/lib/store";
import { ETAPAS, INTERESSES, etapa, type EtapaId, type Lead } from "@/lib/types";
import { rectDe, useUI } from "@/lib/ui";

type Drag = { id: string; w: number; h: number; ox: number; oy: number };
type Pouso = { id: string; left: number; top: number; rotate: number; n: number };

export function CardFace({ l, flutuando = false }: { l: Lead; flutuando?: boolean }) {
  const frio = parado(l);
  return (
    <div className="panel !rounded-[14px] p-3 flex flex-col gap-2.5 select-none"
      style={{
        boxShadow: flutuando ? "var(--shadow-lg)" : undefined,
        borderColor: frio ? "color-mix(in srgb, var(--warn) 45%, var(--line))" : undefined,
      }}>
      <div className="flex items-start gap-2.5">
        <Avatar nome={l.nome} size={30} />
        <div className="min-w-0 flex-1">
          <div className="font-medium leading-tight truncate">{l.nome || "Sem nome"}</div>
          <div className="text-[12px] truncate" style={{ color: "var(--muted)" }}>{l.interesse}</div>
        </div>
        {l.naoLidas > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "var(--gold-ink)" }} title="Mensagem nova">
            <MessageCircle size={13} />{l.naoLidas}
          </span>
        )}
      </div>
      {l.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">{l.tags.slice(0, 2).map((t) => <TagChip key={t} nome={t} />)}{l.tags.length > 2 && <span className="chip">+{l.tags.length - 2}</span>}</div>
      )}
      <div className="flex items-center gap-1.5 flex-wrap text-[11.5px]" style={{ color: "var(--muted)" }}>
        {l.etapa === "agendado" && l.consulta ? (
          <span className="flex items-center gap-1" style={{ color: "var(--ok)" }}><CalendarClock size={13} />{data(l.consulta)} · {hora(l.consulta)}</span>
        ) : frio ? (
          <span className="flex items-center gap-1 font-medium" style={{ color: "var(--warn)" }}><AlertCircle size={13} />Parada há {dias(l.mov)} dias</span>
        ) : (
          <span>{quando(l.mov)}</span>
        )}
        <span>·</span><span>{l.origem}</span>
        {l.valor > 0 && <span className="ml-auto num" style={{ color: "var(--ink)" }}>{brl(l.valor)}</span>}
        {l.dra && !l.dra.feito && (
          <span className="tag tag-ouro !py-0 !px-1.5" title={l.dra.texto}><Stethoscope size={11} />Dra</span>
        )}
      </div>
    </div>
  );
}

function CardNaColuna({ l, pouso, onPress }: { l: Lead; pouso: Pouso | null; onPress: (e: React.PointerEvent, l: Lead, el: HTMLElement) => void }) {
  const inner = useRef<HTMLDivElement>(null);
  const { abrirFicha } = useUI();
  // Pouso: o card "cai" da posição onde foi solto até a vaga dele, com mola e balanço.
  useLayoutEffect(() => {
    if (!pouso || pouso.id !== l.id || !inner.current) return;
    const r = inner.current.getBoundingClientRect();
    animate(inner.current, { x: [pouso.left - r.left, 0], y: [pouso.top - r.top, 0], rotate: [pouso.rotate, 0] },
      { type: "spring", stiffness: 340, damping: 21, mass: 0.9 });
  }, [pouso, l.id]);
  return (
    <motion.div layout="position" transition={{ type: "spring", stiffness: 420, damping: 36 }}>
      <div ref={inner}
        role="button" tabIndex={0} aria-label={`${l.nome}, ${etapa(l.etapa).nome}. Abrir ficha`}
        className="cursor-grab active:cursor-grabbing touch-pan-y rounded-[14px]"
        onPointerDown={(e) => onPress(e, l, inner.current!)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirFicha(l.id, rectDe(inner.current)); } }}>
        <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}><CardFace l={l} /></motion.div>
      </div>
    </motion.div>
  );
}

function Fantasma({ l, x, y, w }: { l: Lead; x: MotionValue<number>; y: MotionValue<number>; w: number }) {
  // O card segue o dedo/mouse com uma mola firme; a rotação vem da velocidade horizontal
  // e passa por uma mola frouxa, então ele balança de um lado pro outro como um pêndulo.
  const sx = useSpring(x, { stiffness: 900, damping: 55, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 900, damping: 55, mass: 0.6 });
  const vx = useVelocity(sx);
  const alvo = useTransform(vx, [-2200, 0, 2200], [-16, 0, 16], { clamp: true });
  const rotate = useSpring(alvo, { stiffness: 170, damping: 8, mass: 0.8 });
  useEffect(() => { fantasmaRot = rotate; return () => { fantasmaRot = null; }; }, [rotate]);
  return createPortal(
    <motion.div style={{ position: "fixed", left: 0, top: 0, x: sx, y: sy, rotate, width: w, zIndex: 1000, pointerEvents: "none" }}
      initial={{ scale: 1 }} animate={{ scale: 1.045 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
      <CardFace l={l} flutuando />
    </motion.div>,
    document.body,
  );
}
let fantasmaRot: MotionValue<number> | null = null;

export function Funil() {
  const { leads, mover } = useCRM();
  const { abrirFicha } = useUI();
  const [q, setQ] = useState("");
  const [interesse, setInteresse] = useState("");
  const [soParados, setSoParados] = useState(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [sobre, setSobre] = useState<EtapaId | null>(null);
  const [pouso, setPouso] = useState<Pouso | null>(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const dragRef = useRef<Drag | null>(null);
  dragRef.current = drag;

  const visiveis = useMemo(() => leads.filter((l) =>
    (!q || l.nome.toLowerCase().includes(q.toLowerCase()) || l.tel.includes(q)) &&
    (!interesse || l.interesse === interesse) && (!soParados || parado(l))), [leads, q, interesse, soParados]);
  const total = leads.filter(parado).length;

  function colunaEm(cx: number, cy: number): EtapaId | null {
    for (const el of document.elementsFromPoint(cx, cy)) {
      const c = (el as HTMLElement).dataset?.col;
      if (c) return c as EtapaId;
    }
    return null;
  }

  function onPress(e: React.PointerEvent, l: Lead, el: HTMLElement) {
    if (e.button !== 0) return;
    const r = el.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY };
    const ox = e.clientX - r.left, oy = e.clientY - r.top;
    const touch = e.pointerType === "touch";
    let ativo = false;
    let timer = 0;

    const comecar = () => {
      ativo = true;
      x.jump(r.left); y.jump(r.top);
      setDrag({ id: l.id, w: r.width, h: r.height, ox, oy });
      setSobre(l.etapa);
      if (touch && navigator.vibrate) navigator.vibrate(12);
    };
    if (touch) timer = window.setTimeout(comecar, 260); // segurar para arrastar no celular; deslizar rola a tela

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
      if (!ativo) {
        if (touch) { if (Math.hypot(dx, dy) > 8) { clearTimeout(timer); limpar(); } return; }
        if (Math.hypot(dx, dy) < 5) return;
        comecar();
      }
      x.set(ev.clientX - ox); y.set(ev.clientY - oy);
      setSobre(colunaEm(ev.clientX, ev.clientY));
    };
    const touchMove = (ev: TouchEvent) => { if (ativo) ev.preventDefault(); };
    const up = (ev: PointerEvent) => {
      clearTimeout(timer);
      limpar();
      if (!ativo) { if (ev.type === "pointerup") abrirFicha(l.id, { left: r.left, top: r.top, width: r.width, height: r.height }); return; }
      const destino = colunaEm(ev.clientX, ev.clientY) ?? l.etapa;
      setPouso({ id: l.id, left: x.get(), top: y.get(), rotate: fantasmaRot?.get() ?? 0, n: Date.now() });
      setDrag(null); setSobre(null);
      if (destino !== l.etapa) mover(l.id, destino);
    };
    function limpar() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("touchmove", touchMove);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("touchmove", touchMove, { passive: false });
  }

  const arrastado = drag ? leads.find((l) => l.id === drag.id) : null;

  return (
    <div>
      <Cabecalho eyebrow="Arraste os cards entre as etapas" titulo={<>Funil de <em style={{ color: "var(--gold-ink)" }}>pacientes</em></>}>
        <label className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input id="funil-busca" className="field !pl-9 !w-[220px]" placeholder="Buscar paciente" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar paciente" />
        </label>
        <select id="funil-interesse" className="field !w-auto cursor-pointer" value={interesse} onChange={(e) => setInteresse(e.target.value)} aria-label="Filtrar por interesse">
          <option value="">Todos os interesses</option>
          {INTERESSES.map((i) => <option key={i}>{i}</option>)}
        </select>
        <button type="button" className="btn" aria-pressed={soParados} onClick={() => setSoParados((v) => !v)}
          style={soParados ? { borderColor: "var(--warn)", color: "var(--warn)", background: "var(--warn-soft)" } : undefined}>
          <AlertCircle size={15} />{total} paradas
        </button>
      </Cabecalho>

      <motion.div layoutScroll className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 scroll-thin snap-x">
        {ETAPAS.map((e) => {
          const cards = visiveis.filter((l) => l.etapa === e.id).sort((a, b) => a.mov - b.mov);
          const soma = cards.reduce((s, l) => s + (l.valor || 0), 0);
          const alvo = drag && sobre === e.id;
          return (
            <motion.section key={e.id} data-col={e.id}
              animate={{ scale: alvo ? 1.012 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-[262px] flex-none rounded-[18px] p-2.5 flex flex-col gap-2 snap-start min-h-[440px]"
              style={{ background: alvo ? "var(--gold-soft)" : "var(--surface-2)", transition: "background .2s", border: `1px ${alvo ? "dashed" : "solid"} ${alvo ? "var(--gold)" : "var(--line)"}` }}
              aria-label={e.nome}>
              <header className="px-1.5 pt-1 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="dot" style={{ background: e.cor, width: 9, height: 9 }} />
                  <h2 className="m-0 text-[13px] font-medium flex-1">{e.nome}</h2>
                  <span className="num text-[12px] px-2 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--line)", color: "var(--muted)" }}>{cards.length}</span>
                </div>
                <div className="text-[11.5px] mt-1 flex justify-between gap-2" style={{ color: "var(--muted)" }}>
                  <span className="truncate">{e.hint}</span>{soma > 0 && <span className="num flex-none">{brl(soma)}</span>}
                </div>
              </header>
              {cards.map((l) => drag?.id === l.id ? (
                <div key={l.id} className="rounded-[14px]" style={{ height: drag.h, border: "1.5px dashed var(--line-2)", background: "var(--surface)" , opacity: .6 }} />
              ) : (
                <CardNaColuna key={l.id} l={l} pouso={pouso} onPress={onPress} />
              ))}
              {cards.length === 0 && (
                <div className="flex-1 grid place-items-center text-[12px] rounded-[14px] min-h-[90px]" style={{ color: "var(--faint)", border: "1.5px dashed var(--line)" }}>Solte um card aqui</div>
              )}
            </motion.section>
          );
        })}
      </motion.div>
      {arrastado && drag && <Fantasma l={arrastado} x={x} y={y} w={drag.w} />}
    </div>
  );
}
