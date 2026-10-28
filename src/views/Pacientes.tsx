"use client";
import { motion } from "motion/react";
import { Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, Cabecalho, EtapaPill, TagChip } from "@/components/bits";
import { brl, data, hora, quando } from "@/lib/fmt";
import { useCRM } from "@/lib/store";
import { DIA, ETAPAS, OPTIN_NOME, type EtapaId, type Optin } from "@/lib/types";
import { rectDe, useUI } from "@/lib/ui";

export function Pacientes() {
  const { leads, tags } = useCRM();
  const { abrirFicha, novoContato } = useUI();
  const [q, setQ] = useState("");
  const [et, setEt] = useState<EtapaId | "">("");
  const [tag, setTag] = useState("");
  const [optin, setOptin] = useState<Optin | "">("");

  const lista = useMemo(() => leads
    .filter((l) => !q || [l.nome, l.tel, l.email].some((v) => v.toLowerCase().includes(q.toLowerCase())))
    .filter((l) => !et || l.etapa === et)
    .filter((l) => !tag || l.tags.includes(tag))
    .filter((l) => !optin || l.optin === optin)
    .sort((a, b) => b.mov - a.mov), [leads, q, et, tag, optin]);

  const mes = leads.filter((l) => l.criado > Date.now() - 30 * DIA).length;
  const resumo = [
    { l: "Pacientes", v: leads.length },
    { l: "Novas em 30 dias", v: mes },
    { l: "Aceitam WhatsApp", v: `${Math.round((leads.filter((l) => l.optin === "sim").length / Math.max(1, leads.length)) * 100)}%` },
    { l: "Em negociação", v: leads.filter((l) => ["protocolo", "retorno", "agendar"].includes(l.etapa)).length },
  ];

  return (
    <div>
      <Cabecalho eyebrow="Todas as pacientes" titulo="Pacientes">
        <button type="button" className="btn btn-gold" onClick={novoContato}><UserPlus size={16} />Nova paciente</button>
      </Cabecalho>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {resumo.map((r) => (
          <div key={r.l} className="panel p-4"><div className="eyebrow">{r.l}</div><div className="display text-[34px] leading-none mt-2 num">{r.v}</div></div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center mb-3">
        <label className="relative flex-1 min-w-[220px] max-w-[340px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input id="pac-busca" className="field !pl-9" placeholder="Nome, telefone ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar paciente" />
        </label>
        <select id="pac-etapa" className="field !w-auto cursor-pointer" value={et} onChange={(e) => setEt(e.target.value as EtapaId | "")} aria-label="Filtrar por etapa">
          <option value="">Todas as etapas</option>
          {ETAPAS.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <select id="pac-optin" className="field !w-auto cursor-pointer" value={optin} onChange={(e) => setOptin(e.target.value as Optin | "")} aria-label="Filtrar por consentimento do WhatsApp">
          <option value="">WhatsApp: todas</option>
          {(["sim", "pendente", "nao"] as const).map((o) => <option key={o} value={o}>WhatsApp: {OPTIN_NOME[o]}</option>)}
        </select>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <button key={t.nome} type="button" aria-pressed={tag === t.nome} onClick={() => setTag(tag === t.nome ? "" : t.nome)}
              className={`tag tag-${t.cor} cursor-pointer`} style={{ outline: tag === t.nome ? "2px solid var(--gold)" : "none", outlineOffset: 1 }}>{t.nome}</button>
          ))}
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="eyebrow" style={{ background: "var(--surface-2)" }}>
                {["Paciente", "Etapa", "Interesse", "Etiquetas", "Próxima consulta", "WhatsApp", "Valor", "Última atualização"].map((h) => (
                  <th key={h} className="font-medium px-4 py-3" style={{ borderBottom: "1px solid var(--line)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((l, i) => (
                <motion.tr key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="cursor-pointer hover:bg-[var(--surface-2)]" style={{ borderBottom: "1px solid var(--line)" }}
                  onClick={(e) => abrirFicha(l.id, rectDe(e.currentTarget))} tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && abrirFicha(l.id, rectDe(e.currentTarget))}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3"><Avatar nome={l.nome} />
                      <div className="min-w-0"><div className="font-medium">{l.nome}</div><div className="text-[12px]" style={{ color: "var(--muted)" }}>{l.tel}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><EtapaPill id={l.etapa} /></td>
                  <td className="px-4 py-3">{l.interesse}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{l.tags.map((t) => <TagChip key={t} nome={t} />)}</div></td>
                  <td className="px-4 py-3 text-[12.5px]">{l.consulta && l.consulta > Date.now() - 3600e3 ? <>{data(l.consulta)}<span className="block" style={{ color: "var(--muted)" }}>{hora(l.consulta)}</span></> : <span style={{ color: "var(--faint)" }}>—</span>}</td>
                  <td className="px-4 py-3"><span className={`tag ${l.optin === "sim" ? "tag-salvia" : l.optin === "pendente" ? "tag-terra" : "tag-cinza"}`}>{OPTIN_NOME[l.optin]}</span></td>
                  <td className="px-4 py-3 num">{l.valor ? brl(l.valor) : "—"}</td>
                  <td className="px-4 py-3 text-[12.5px]" style={{ color: "var(--muted)" }}>{quando(l.mov)}<span className="block">{data(l.mov)}</span></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {lista.length === 0 && <div className="text-center py-10 text-[13px]" style={{ color: "var(--muted)" }}>Nenhuma paciente com esses filtros.</div>}
      </div>
    </div>
  );
}
