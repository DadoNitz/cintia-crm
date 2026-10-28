"use client";
import { Download, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Cabecalho, TagChip } from "@/components/bits";
import { BotaoTema } from "@/components/Sidebar";
import { useCRM } from "@/lib/store";
import { ETAPAS, etapa } from "@/lib/types";

function exportarCSV(linhas: string[][]) {
  const csv = linhas.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = "pacientes-cintia-machado.csv"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Ajustes() {
  const { leads, tags, resetar } = useCRM();
  const [confirmar, setConfirmar] = useState(false);
  return (
    <div className="max-w-[860px] flex flex-col gap-4">
      <Cabecalho eyebrow="Configurações da clínica" titulo="Ajustes" />

      <section className="panel p-5">
        <h2 className="eyebrow !text-[var(--ink)] m-0 mb-1">Etapas do funil</h2>
        <p className="text-[13px] mt-0 mb-4" style={{ color: "var(--muted)" }}>Definidas com a Dra Cintia a partir de como a recepção já trabalha.</p>
        <ol className="m-0 p-0 list-none grid sm:grid-cols-2 gap-2">
          {ETAPAS.map((e, i) => (
            <li key={e.id} className="flex items-center gap-3 rounded-xl p-3" style={{ border: "1px solid var(--line)" }}>
              <span className="num text-[12px] w-5" style={{ color: "var(--muted)" }}>{i + 1}</span>
              <span className="dot" style={{ background: e.cor, width: 10, height: 10 }} />
              <span className="flex-1"><span className="block font-medium text-[13.5px]">{e.nome}</span><span className="text-[12px]" style={{ color: "var(--muted)" }}>{e.hint}</span></span>
              <span className="num text-[12px]" style={{ color: "var(--muted)" }}>{leads.filter((l) => l.etapa === e.id).length}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel p-5">
        <h2 className="eyebrow !text-[var(--ink)] m-0 mb-1">Etiquetas</h2>
        <p className="text-[13px] mt-0 mb-4" style={{ color: "var(--muted)" }}>Crie novas etiquetas direto na ficha de qualquer paciente.</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t.nome} className="flex items-center gap-1.5"><TagChip nome={t.nome} /><span className="num text-[11.5px]" style={{ color: "var(--muted)" }}>{leads.filter((l) => l.tags.includes(t.nome)).length}</span></span>
          ))}
        </div>
      </section>

      <section className="panel p-5 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[220px]"><h2 className="eyebrow !text-[var(--ink)] m-0 mb-1">Aparência</h2><p className="text-[13px] m-0" style={{ color: "var(--muted)" }}>Tema claro ou escuro, salvo neste navegador.</p></div>
        <BotaoTema claro />
      </section>

      <section className="panel p-5 flex flex-col gap-3">
        <h2 className="eyebrow !text-[var(--ink)] m-0">Dados</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn" onClick={() => exportarCSV([
            ["Nome", "WhatsApp", "E-mail", "Etapa", "Interesse", "Origem", "Etiquetas", "Valor"],
            ...leads.map((l) => [l.nome, l.tel, l.email, etapa(l.etapa).nome, l.interesse, l.origem, l.tags.join(", "), String(l.valor || "")]),
          ])}><Download size={15} />Exportar pacientes (CSV)</button>
          {confirmar ? (
            <span className="flex items-center gap-2 text-[13px]">
              <span style={{ color: "var(--bad)" }}>Apagar tudo e voltar aos dados de exemplo?</span>
              <button type="button" className="btn" onClick={() => setConfirmar(false)}>Cancelar</button>
              <button type="button" className="btn" style={{ color: "var(--bad)", borderColor: "var(--bad)" }} onClick={() => { resetar(); setConfirmar(false); }}>Restaurar</button>
            </span>
          ) : (
            <button type="button" className="btn" onClick={() => setConfirmar(true)}><RotateCcw size={15} />Restaurar dados de exemplo</button>
          )}
        </div>
        <p className="text-[12.5px] m-0" style={{ color: "var(--muted)" }}>Versão de demonstração: os dados ficam salvos só neste navegador. Na versão contratada eles ficam num banco de dados com login para a equipe e backup diário.</p>
      </section>
    </div>
  );
}
