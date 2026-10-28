"use client";
import { iniciais, tom } from "@/lib/fmt";
import { useCRM } from "@/lib/store";
import { ETAPAS, etapa, type EtapaId } from "@/lib/types";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export function Avatar({ nome, size = 34 }: { nome: string; size?: number }) {
  return <div className={`avatar av-${tom(nome)}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>{iniciais(nome)}</div>;
}

export function TagChip({ nome, onRemove }: { nome: string; onRemove?: () => void }) {
  const { tags } = useCRM();
  const cor = tags.find((t) => t.nome === nome)?.cor ?? "cinza";
  return (
    <span className={`tag tag-${cor}`}>
      {nome}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remover etiqueta ${nome}`} className="cursor-pointer opacity-70 hover:opacity-100 -mr-1 px-0.5">×</button>
      )}
    </span>
  );
}

export function EtapaPill({ id }: { id: EtapaId }) {
  const e = etapa(id);
  return (
    <span className="chip" style={{ color: "var(--ink)" }}>
      <span className="dot" style={{ background: e.cor }} />
      {e.nome}
    </span>
  );
}

export function EtapaSelect({ value, onChange, id }: { value: EtapaId; onChange: (v: EtapaId) => void; id?: string }) {
  return (
    <div className="relative inline-flex items-center">
      <span className="dot absolute left-3 pointer-events-none" style={{ background: etapa(value).cor }} />
      <select id={id} className="field !py-1.5 !pl-7 !pr-8 !w-auto cursor-pointer" value={value} onChange={(e) => onChange(e.target.value as EtapaId)} aria-label="Etapa do funil">
        {ETAPAS.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
      </select>
    </div>
  );
}

// Controle segmentado com o fundo deslizando entre as opções
export function Seg<T extends string>({ value, onChange, opcoes, id }: { value: T; onChange: (v: T) => void; opcoes: { v: T; label: ReactNode }[]; id: string }) {
  return (
    <div className="seg" role="group">
      {opcoes.map((o) => (
        <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)}>
          {value === o.v && <motion.span layoutId={`seg-${id}`} className="seg-bg" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Cabecalho({ eyebrow, titulo, children }: { eyebrow?: string; titulo: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-4 mb-6">
      <div className="flex-1 min-w-[220px]">
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h1 className="display text-[34px] leading-[1.05] m-0" style={{ textWrap: "balance" }}>{titulo}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <div className="text-center text-[13px] py-8 px-4 rounded-xl" style={{ color: "var(--muted)", border: "1px dashed var(--line-2)" }}>{children}</div>;
}
