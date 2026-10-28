"use client";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CheckCheck, FileText, RefreshCw, SendHorizontal, Sparkles, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { dataLonga, hora } from "@/lib/fmt";
import { pedirSugestoes, type Resultado } from "@/lib/ia";
import { preencher, useCRM } from "@/lib/store";
import { etapa, type Lead } from "@/lib/types";

// Respostas rápidas com informações do próprio site da Dra.
export const RAPIDAS = [
  { nome: "Horários", texto: "Atendemos de segunda a sexta, das 9h às 18h. Qual período fica melhor pra você?" },
  { nome: "Online ou presencial", texto: "A consulta pode ser presencial ou online, seguindo a mesma estrutura. Qual você prefere?" },
  { nome: "Convênio", texto: "Os atendimentos são particulares, mas os exames solicitados pela Dra podem ser feitos pelo seu convênio 🤍" },
  { nome: "Como é a consulta", texto: "Na consulta a Dra Cintia tem tempo para entender seu histórico, rotina e objetivos, e monta um tratamento individualizado pra você." },
  { nome: "Enviar valores", texto: "Vou te enviar os valores e os horários disponíveis desta semana, tudo bem?" },
];

// Guarda as sugestões por conversa + quantidade de mensagens, para não pedir de novo ao trocar de conversa e voltar.
const cache = new Map<string, Resultado>();
const pedindo = new Set<string>();

function SugestoesIA({ l, usar }: { l: Lead; usar: (t: string) => void }) {
  const { mover, config } = useCRM();
  const chave = `${l.id}:${l.msgs.length}`;
  const [res, setRes] = useState<Resultado | null>(cache.get(chave) ?? null);
  const [carregando, setCarregando] = useState(false);

  const pedir = useCallback(async (forcar = false) => {
    if (!forcar && cache.has(chave)) { setRes(cache.get(chave)!); return; }
    if (pedindo.has(chave)) return;
    pedindo.add(chave); setCarregando(true);
    const r = await pedirSugestoes(l);
    pedindo.delete(chave); cache.set(chave, r); setRes(r); setCarregando(false);
  }, [chave, l]);

  useEffect(() => {
    setRes(cache.get(chave) ?? null);
    // Sugere sempre ao abrir: se a paciente falou, respostas; se a clínica falou por último, formas de retomar
    if (config.sugestoesIA && !cache.has(chave)) pedir();
  }, [chave, config.sugestoesIA, pedir]);

  if (!config.sugestoesIA) return null;
  return (
    <div className="px-3 pt-2.5 pb-1" style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}>
      <div className="flex items-center gap-2 mb-2 text-[11.5px]" style={{ color: "var(--muted)" }}>
        <Sparkles size={13} style={{ color: "var(--gold)" }} />
        <span className="font-medium" style={{ color: "var(--ink)" }}>Sugestões</span>
        {res && <span>{res.fonte === "ia" ? "por IA · revise antes de enviar" : "rápidas · IA não configurada"}</span>}
        <button type="button" onClick={() => pedir(true)} disabled={carregando} className="ml-auto flex items-center gap-1 cursor-pointer hover:text-[var(--ink)]" aria-label="Gerar novas sugestões">
          <motion.span animate={carregando ? { rotate: 360 } : { rotate: 0 }} transition={carregando ? { repeat: Infinity, duration: 0.9, ease: "linear" } : {}}><RefreshCw size={12} /></motion.span>
          {res ? "Gerar outras" : "Sugerir respostas"}
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto scroll-thin pb-2">
        {/* Fora do AnimatePresence: a transição com repeat infinito valia também para a saída, e os esqueletos nunca sumiam */}
        {carregando && [0, 1, 2].map((i) => (
          <motion.div key={`sk${i}`} animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
            className="flex-none w-[230px] h-[64px] rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }} />
        ))}
        <AnimatePresence mode="popLayout">
          {!carregando && res?.sugestoes.map((s, i) => (
            <motion.button key={`${chave}-${i}-${s.rotulo}`} type="button" onClick={() => usar(s.texto)}
              initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.06, type: "spring", stiffness: 420, damping: 30 }}
              whileHover={{ y: -2 }}
              className="flex-none w-[230px] text-left rounded-xl px-3 py-2 cursor-pointer" style={{ background: "var(--gold-soft)", border: "1px solid color-mix(in srgb, var(--gold) 28%, transparent)" }}
              title="Usar esta sugestão (dá pra editar antes de enviar)">
              <span className="block text-[11px] font-medium mb-0.5" style={{ color: "var(--gold-ink)" }}>{s.rotulo}</span>
              <span className="text-[12.5px] leading-snug line-clamp-2">{s.texto}</span>
            </motion.button>
          ))}
          {!carregando && res?.etapa && res.etapa !== l.etapa && (
            <motion.button key={`etapa-${res.etapa}`} type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => { mover(l.id, res.etapa!); setRes({ ...res, etapa: null }); }}
              className="flex-none w-[190px] text-left rounded-xl px-3 py-2 cursor-pointer" style={{ border: "1px dashed var(--gold)" }}>
              <span className="flex items-center gap-1 text-[11px] font-medium mb-0.5" style={{ color: "var(--gold-ink)" }}><ArrowRight size={12} />Mover no funil</span>
              <span className="text-[12.5px] leading-snug">Para <b className="font-medium">{etapa(res.etapa).nome}</b>{res.motivo ? ` · ${res.motivo}` : ""}</span>
            </motion.button>
          )}
        </AnimatePresence>
        {!carregando && !res && (
          <span className="text-[12px] py-1" style={{ color: "var(--faint)" }}>Clique em “Sugerir respostas” para ver opções baseadas na conversa.</span>
        )}
      </div>
    </div>
  );
}

export function ChatThread({ l, compacto = false }: { l: Lead; compacto?: boolean }) {
  const { enviar, lerConversa, digitando, modelos } = useCRM();
  const [texto, setTexto] = useState("");
  const [rapidas, setRapidas] = useState(false);
  const fim = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { lerConversa(l.id); }, [l.id, l.msgs.length, lerConversa]);
  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [l.msgs.length, digitando]);

  const usar = (t: string) => { setTexto(t); setRapidas(false); requestAnimationFrame(() => { campo.current?.focus(); campo.current?.setSelectionRange(t.length, t.length); }); };
  const mandar = () => { const v = texto.trim(); if (!v) return; enviar(l.id, v); setTexto(""); setRapidas(false); };

  // Digitar "/" abre os modelos aprovados, como no WhatsApp Business
  const busca = texto.startsWith("/") ? texto.slice(1).toLowerCase() : null;
  const modelosFiltrados = busca === null ? [] : modelos.filter((m) => m.status === "Aprovado" && (m.nome.includes(busca) || m.titulo.toLowerCase().includes(busca)));

  let dia = "";
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto scroll-thin px-4 py-4 flex flex-col gap-1.5"
        style={{ background: "radial-gradient(circle at 20% 10%, var(--gold-soft), transparent 55%), var(--surface-2)" }}>
        {l.msgs.length === 0 && <div className="m-auto text-center text-[13px] max-w-[260px]" style={{ color: "var(--muted)" }}>Nenhuma mensagem ainda. Comece a conversa ou digite / para usar um modelo.</div>}
        <AnimatePresence initial={false}>
          {l.msgs.map((m) => {
            const d = dataLonga(m.t);
            const sep = d !== dia; dia = d;
            const nossa = m.de === "c";
            return (
              <motion.div key={m.id} layout="position" initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 30 }}
                className="flex flex-col">
                {sep && <div className="self-center text-[11px] my-2 px-3 py-0.5 rounded-full" style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--line)" }}>{d}</div>}
                <div className={`max-w-[78%] px-3 py-2 text-[13.5px] leading-snug whitespace-pre-wrap ${nossa ? "self-end" : "self-start"}`}
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
                <motion.span key={i} className="dot" style={{ background: "var(--muted)" }} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={fim} />
      </div>

      <SugestoesIA key={l.id} l={l} usar={usar} />

      <AnimatePresence>
        {rapidas && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden" style={{ borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
            <div className="flex flex-wrap gap-1.5 p-3">
              {RAPIDAS.map((r) => (
                <button key={r.nome} type="button" className="chip cursor-pointer hover:!border-[var(--gold)]" style={{ color: "var(--ink)" }} title={r.texto} onClick={() => usar(r.texto)}>{r.nome}</button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <AnimatePresence>
          {busca !== null && (
            <motion.ul initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              className="absolute left-3 right-3 bottom-[calc(100%+6px)] z-10 panel p-1.5 m-0 list-none max-h-64 overflow-y-auto" style={{ boxShadow: "var(--shadow-lg)" }}>
              <li className="eyebrow px-2 py-1">Modelos aprovados</li>
              {modelosFiltrados.map((m) => (
                <li key={m.id}>
                  <button type="button" className="w-full text-left p-2 rounded-lg cursor-pointer hover:bg-[var(--surface-2)] flex gap-2.5" onClick={() => usar(preencher(m.texto, l))}>
                    <FileText size={15} className="mt-0.5 flex-none" style={{ color: "var(--gold-ink)" }} />
                    <span className="min-w-0"><span className="block text-[12.5px] font-medium">{m.nome}</span><span className="block text-[12px] truncate" style={{ color: "var(--muted)" }}>{preencher(m.texto, l)}</span></span>
                  </button>
                </li>
              ))}
              {modelosFiltrados.length === 0 && <li className="text-[12.5px] p-2" style={{ color: "var(--muted)" }}>Nenhum modelo com esse nome.</li>}
            </motion.ul>
          )}
        </AnimatePresence>
        <form className={`flex items-end gap-2 ${compacto ? "p-2.5" : "p-3"}`} style={{ borderTop: "1px solid var(--line)", background: "var(--surface)" }}
          onSubmit={(e) => { e.preventDefault(); mandar(); }}>
          <button type="button" className="icon-btn flex-none" aria-pressed={rapidas} aria-label="Respostas rápidas" onClick={() => setRapidas((v) => !v)}
            style={rapidas ? { background: "var(--gold-soft)", borderColor: "var(--gold)" } : undefined}><Zap size={16} style={{ color: "var(--gold-ink)" }} /></button>
          <textarea ref={campo} id={`msg-${l.id}`} rows={texto.length > 80 ? 3 : 1} className="field resize-none !py-2 max-h-32" placeholder={`Mensagem para ${l.nome.split(" ")[0] || "paciente"} · / para modelos`}
            value={texto} onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (busca !== null && modelosFiltrados[0]) usar(preencher(modelosFiltrados[0].texto, l)); else mandar(); } if (e.key === "Escape" && busca !== null) setTexto(""); }} aria-label="Mensagem" />
          <motion.button whileTap={{ scale: 0.9 }} type="submit" className="btn btn-gold !px-3 flex-none" aria-label="Enviar" disabled={!texto.trim() || busca !== null} style={{ opacity: texto.trim() && busca === null ? 1 : 0.5 }}>
            <SendHorizontal size={16} />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
