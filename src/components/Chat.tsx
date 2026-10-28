"use client";
import { AnimatePresence, motion } from "motion/react";
import { CheckCheck, SendHorizontal, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { dataLonga, hora } from "@/lib/fmt";
import { useCRM } from "@/lib/store";
import type { Lead } from "@/lib/types";

// Respostas rápidas com informações do próprio site da Dra.
export const RAPIDAS = [
  { nome: "Horários", texto: "Atendemos de segunda a sexta, das 9h às 18h. Qual período fica melhor pra você?" },
  { nome: "Online ou presencial", texto: "A consulta pode ser presencial ou online, seguindo a mesma estrutura. Qual você prefere?" },
  { nome: "Convênio", texto: "Os atendimentos são particulares, mas os exames solicitados pela Dra podem ser feitos pelo seu convênio 🤍" },
  { nome: "Como é a consulta", texto: "Na consulta a Dra Cintia tem tempo para entender seu histórico, rotina e objetivos, e monta um tratamento individualizado pra você." },
  { nome: "Enviar valores", texto: "Vou te enviar os valores e os horários disponíveis desta semana, tudo bem?" },
];

export function ChatThread({ l, compacto = false }: { l: Lead; compacto?: boolean }) {
  const { enviar, lerConversa, digitando } = useCRM();
  const [texto, setTexto] = useState("");
  const [rapidas, setRapidas] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => { lerConversa(l.id); }, [l.id, l.msgs.length, lerConversa]);
  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [l.msgs.length, digitando]);

  const mandar = (t = texto) => {
    const v = t.trim(); if (!v) return;
    enviar(l.id, v); setTexto(""); setRapidas(false);
  };

  let dia = "";
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto scroll-thin px-4 py-4 flex flex-col gap-1.5"
        style={{ background: "radial-gradient(circle at 20% 10%, var(--gold-soft), transparent 55%), var(--surface-2)" }}>
        {l.msgs.length === 0 && <div className="m-auto text-center text-[13px] max-w-[260px]" style={{ color: "var(--muted)" }}>Nenhuma mensagem ainda. Comece a conversa ou use uma resposta rápida.</div>}
        <AnimatePresence initial={false}>
          {l.msgs.map((m) => {
            const d = dataLonga(m.t);
            const sep = d !== dia; dia = d;
            const nossa = m.de === "c";
            return (
              <motion.div key={m.id} layout="position" initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 30 }}
                className="flex flex-col">
                {sep && <div className="self-center text-[11px] my-2 px-3 py-0.5 rounded-full" style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--line)" }}>{d}</div>}
                <div className={`max-w-[78%] px-3 py-2 text-[13.5px] leading-snug ${nossa ? "self-end" : "self-start"}`}
                  style={{
                    background: nossa ? "var(--gold-soft)" : "var(--surface)",
                    border: `1px solid ${nossa ? "color-mix(in srgb, var(--gold) 30%, transparent)" : "var(--line)"}`,
                    borderRadius: nossa ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  }}>
                  {m.texto}
                  <span className="float-right ml-3 mt-1.5 text-[10.5px] flex items-center gap-1" style={{ color: "var(--muted)" }}>
                    {hora(m.t)}{nossa && <CheckCheck size={13} style={{ color: "var(--gold)" }} />}
                  </span>
                </div>
              </motion.div>
            );
          })}
          {digitando === l.id && (
            <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="self-start px-3 py-2.5 rounded-[14px] flex gap-1" style={{ background: "var(--surface)", border: "1px solid var(--line)" }} aria-label="Digitando">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="dot" style={{ background: "var(--muted)" }}
                  animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={fim} />
      </div>

      <AnimatePresence>
        {rapidas && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden" style={{ borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
            <div className="flex flex-wrap gap-1.5 p-3">
              {RAPIDAS.map((r) => (
                <button key={r.nome} type="button" className="chip cursor-pointer hover:!border-[var(--gold)]" style={{ color: "var(--ink)" }} title={r.texto} onClick={() => setTexto(r.texto)}>{r.nome}</button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form className={`flex items-end gap-2 ${compacto ? "p-2.5" : "p-3"}`} style={{ borderTop: "1px solid var(--line)", background: "var(--surface)" }}
        onSubmit={(e) => { e.preventDefault(); mandar(); }}>
        <button type="button" className="icon-btn flex-none" aria-pressed={rapidas} aria-label="Respostas rápidas" onClick={() => setRapidas((v) => !v)}
          style={rapidas ? { background: "var(--gold-soft)", borderColor: "var(--gold)" } : undefined}><Zap size={16} style={{ color: "var(--gold-ink)" }} /></button>
        <textarea id={`msg-${l.id}`} rows={1} className="field resize-none !py-2 max-h-28" placeholder={`Mensagem para ${l.nome.split(" ")[0] || "paciente"}`}
          value={texto} onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); mandar(); } }} aria-label="Mensagem" />
        <motion.button whileTap={{ scale: 0.9 }} type="submit" className="btn btn-gold !px-3 flex-none" aria-label="Enviar" disabled={!texto.trim()} style={{ opacity: texto.trim() ? 1 : 0.5 }}>
          <SendHorizontal size={16} />
        </motion.button>
      </form>
    </div>
  );
}
