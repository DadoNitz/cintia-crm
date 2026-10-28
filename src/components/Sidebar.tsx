"use client";
import { AnimatePresence, motion } from "motion/react";
import { BarChart3, CalendarDays, ClipboardCheck, Columns3, LayoutDashboard, Megaphone, MessageCircle, Moon, MoreHorizontal, Settings2, Sun, Users } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { useCRM } from "@/lib/store";
import { useUI, type View } from "@/lib/ui";
import { temaAtual, trocarTema, type Tema } from "@/lib/liquid";

type Item = { id: View; nome: string; curto: string; Icon: ComponentType<{ size?: number; strokeWidth?: number }> };
const ITENS: Item[] = [
  { id: "painel", nome: "Painel", curto: "Painel", Icon: LayoutDashboard },
  { id: "funil", nome: "Funil de pacientes", curto: "Funil", Icon: Columns3 },
  { id: "conversas", nome: "Conversas", curto: "Chat", Icon: MessageCircle },
  { id: "pacientes", nome: "Pacientes", curto: "Pacientes", Icon: Users },
  { id: "agenda", nome: "Agenda", curto: "Agenda", Icon: CalendarDays },
  { id: "campanhas", nome: "Campanhas", curto: "Campanhas", Icon: Megaphone },
  { id: "relatorios", nome: "Relatórios", curto: "Relatórios", Icon: BarChart3 },
  { id: "pendencias", nome: "Pendências da Dra", curto: "Dra", Icon: ClipboardCheck },
  { id: "ajustes", nome: "Ajustes", curto: "Ajustes", Icon: Settings2 },
];
const NO_CELULAR: View[] = ["painel", "funil", "conversas", "agenda"];

const mola = { type: "spring" as const, stiffness: 420, damping: 34 };

export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 40 40" className="w-9 h-9 flex-none" aria-hidden>
        <circle cx="20" cy="20" r="18.5" fill="none" stroke="var(--side-mark)" strokeWidth="1.2" />
        <path d="M22.5 11a8.5 8.5 0 1 0 0 17h3.5V18.5" fill="none" stroke="var(--side-mark)" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      {!compacta && (
        <div className="leading-none">
          <div style={{ letterSpacing: ".2em", fontSize: 13, color: "var(--side-mark)" }}>CINTIA MACHADO</div>
          <div style={{ letterSpacing: ".62em", fontSize: 8.5, color: "var(--side-mark)", marginTop: 5, fontWeight: 500 }}>CLINIC</div>
        </div>
      )}
    </div>
  );
}

export function BotaoTema({ claro = false }: { claro?: boolean }) {
  const [tema, setTema] = useState<Tema>("light");
  useEffect(() => setTema(temaAtual()), []);
  return (
    <button
      type="button"
      className={claro ? "icon-btn" : "flex items-center gap-2 w-full rounded-xl px-3 py-2.5 cursor-pointer"}
      style={claro ? undefined : { color: "var(--side-muted)", border: "1px solid var(--side-line)" }}
      aria-label={tema === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const prox: Tema = tema === "dark" ? "light" : "dark";
        trocarTema(prox, r.left + r.width / 2, r.top + r.height / 2);
        setTema(prox);
      }}
    >
      <motion.span key={tema} initial={{ rotate: -90, scale: 0.4, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={mola} className="grid place-items-center">
        {tema === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </motion.span>
      {!claro && <span className="text-[13px]">{tema === "dark" ? "Tema claro" : "Tema escuro"}</span>}
    </button>
  );
}

export function Sidebar() {
  const { view, ir } = useUI();
  const [mais, setMais] = useState(false);
  const { leads } = useCRM();
  const contagem: Partial<Record<View, number>> = {
    conversas: leads.filter((l) => l.naoLidas > 0).length,
    pendencias: leads.filter((l) => l.dra && !l.dra.feito).length,
  };

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-[248px] flex-none h-full px-4 py-5 gap-5 overflow-y-auto scroll-thin" style={{ background: "var(--side)", color: "var(--side-ink)" }}>
        <div className="px-2"><Marca /></div>
        <nav className="flex flex-col gap-1" aria-label="Seções">
          {ITENS.map(({ id, nome, Icon }) => {
            const ativo = view === id;
            return (
              <button key={id} type="button" onClick={() => ir(id)} aria-current={ativo ? "page" : undefined}
                className="relative flex items-center gap-3 rounded-xl px-3 py-2 text-left cursor-pointer"
                style={{ color: ativo ? "var(--side-ink)" : "var(--side-muted)" }}>
                {ativo && <motion.span layoutId="pill" transition={mola} className="absolute inset-0 rounded-xl" style={{ background: "var(--side-pill)", boxShadow: "var(--shadow)" }} />}
                {ativo && <motion.span layoutId="pill-bar" transition={mola} className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ background: "var(--gold)" }} />}
                <motion.span className="relative" animate={ativo ? { scale: [1, 1.22, 1], rotate: [0, -8, 0] } : { scale: 1 }} transition={{ duration: 0.45 }}>
                  <Icon size={18} strokeWidth={ativo ? 2 : 1.6} />
                </motion.span>
                <span className="relative text-[14px] flex-1">{nome}</span>
                {!!contagem[id] && <span className="relative badge">{contagem[id]}</span>}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <div className="rounded-xl p-3 text-[12.5px] leading-snug" style={{ background: "var(--side-pill)", color: "var(--side-muted)" }}>
            <div className="flex items-center gap-2 mb-1" style={{ color: "var(--side-ink)" }}>
              <span className="dot" style={{ background: "#7DBE72" }} /> WhatsApp da clínica
            </div>
            (51) 99716-9188 · simulado na demo
          </div>
          <BotaoTema />
          <div className="flex items-center gap-3 px-1">
            <div className="avatar" style={{ background: "var(--gold-btn)", color: "var(--on-gold)" }}>AN</div>
            <div className="leading-tight">
              <div className="text-[13px]">Ana</div>
              <div className="text-[11.5px]" style={{ color: "var(--side-muted)" }}>Recepção · home office</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Celular: 4 atalhos + "Mais" abre o resto numa folha que sobe de baixo */}
      <AnimatePresence>
        {mais && (
          <>
            <motion.div className="md:hidden fixed inset-0 z-40" style={{ background: "rgb(20 14 8 / .35)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMais(false)} />
            <motion.div className="md:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-[22px] p-4 pt-3 grid grid-cols-3 gap-2"
              style={{ background: "var(--side)", paddingBottom: "calc(76px + env(safe-area-inset-bottom, 0px))" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 36 }}>
              <div className="col-span-3 mx-auto w-10 h-1 rounded-full mb-2" style={{ background: "var(--side-line)" }} />
              {ITENS.filter((i) => !NO_CELULAR.includes(i.id)).map(({ id, nome, Icon }) => (
                <button key={id} type="button" onClick={() => { ir(id); setMais(false); }}
                  className="relative flex flex-col items-center gap-1.5 rounded-xl py-3 text-[12px] cursor-pointer"
                  style={{ background: view === id ? "var(--side-pill)" : "transparent", color: "var(--side-ink)" }}>
                  <Icon size={20} />{nome}
                  {!!contagem[id] && <span className="absolute top-2 right-3 badge">{contagem[id]}</span>}
                </button>
              ))}
              <div className="col-span-3 flex justify-center pt-1"><BotaoTema /></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex justify-around"
        style={{ background: "var(--side)", paddingBottom: "env(safe-area-inset-bottom, 0px)", paddingLeft: "env(safe-area-inset-left,0px)", paddingRight: "env(safe-area-inset-right,0px)" }}
        aria-label="Seções">
        {[...ITENS.filter((i) => NO_CELULAR.includes(i.id)), { id: "mais" as const, curto: "Mais", nome: "Mais", Icon: MoreHorizontal }].map(({ id, curto, Icon }) => {
          const ativo = id === "mais" ? mais || !NO_CELULAR.includes(view) : view === id && !mais;
          const n = id === "mais" ? (contagem.pendencias ?? 0) : contagem[id as View];
          return (
            <button key={id} type="button" onClick={() => id === "mais" ? setMais((v) => !v) : (ir(id as View), setMais(false))} aria-current={ativo ? "page" : undefined}
              className="relative flex-1 flex flex-col items-center gap-0.5 py-2 cursor-pointer text-[10.5px]"
              style={{ color: ativo ? "var(--side-ink)" : "var(--side-muted)" }}>
              {ativo && <motion.span layoutId="pill-m" transition={mola} className="absolute inset-x-1.5 inset-y-1 rounded-xl" style={{ background: "var(--side-pill)" }} />}
              <span className="relative"><Icon size={19} strokeWidth={ativo ? 2 : 1.6} />
                {!!n && <span className="absolute -top-1.5 -right-2.5 badge" style={{ minWidth: 15, height: 15, fontSize: 9.5 }}>{n}</span>}
              </span>
              <span className="relative">{curto}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
