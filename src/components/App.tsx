"use client";
import { AnimatePresence, motion } from "motion/react";
import { Search, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, EtapaPill } from "@/components/bits";
import { Ficha } from "@/components/Ficha";
import { BotaoTema, Marca, Sidebar } from "@/components/Sidebar";
import { CRMProvider, useCRM } from "@/lib/store";
import { UICtx, VIEWS, rectDe, useUI, type Rect, type View } from "@/lib/ui";
import { Agenda } from "@/views/Agenda";
import { Ajustes } from "@/views/Ajustes";
import { Conversas } from "@/views/Conversas";
import { Funil } from "@/views/Funil";
import { Pacientes } from "@/views/Pacientes";
import { Painel } from "@/views/Painel";
import { Pendencias } from "@/views/Pendencias";

const TELAS: Record<View, () => React.JSX.Element> = { painel: Painel, funil: Funil, conversas: Conversas, pacientes: Pacientes, agenda: Agenda, pendencias: Pendencias, ajustes: Ajustes };
const lerHash = (): View => { const h = location.hash.replace("#", "") as View; return VIEWS.includes(h) ? h : "painel"; };

function Busca() {
  const { leads } = useCRM();
  const ui = useUI();
  const [q, setQ] = useState("");
  const [aberta, setAberta] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const res = useMemo(() => q.trim() ? leads.filter((l) => l.nome.toLowerCase().includes(q.toLowerCase()) || l.tel.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "§")).slice(0, 6) : [], [leads, q]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); ref.current?.focus(); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, []);
  return (
    <div className="relative flex-1 max-w-[420px]">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
      <input ref={ref} id="busca-global" className="field !pl-9 !pr-14" placeholder="Buscar paciente" value={q}
        onChange={(e) => { setQ(e.target.value); setAberta(true); }} onFocus={() => setAberta(true)} onBlur={() => setTimeout(() => setAberta(false), 150)} aria-label="Buscar paciente" />
      <kbd className="hidden sm:block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10.5px] px-1.5 py-0.5 rounded-md" style={{ border: "1px solid var(--line)", color: "var(--muted)", fontFamily: "inherit" }}>Ctrl K</kbd>
      <AnimatePresence>
        {aberta && res.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }}
            className="absolute z-30 left-0 right-0 top-[calc(100%+6px)] panel p-1.5 m-0 list-none" style={{ boxShadow: "var(--shadow-lg)" }}>
            {res.map((l) => (
              <li key={l.id}>
                <button type="button" className="w-full flex items-center gap-3 p-2 rounded-lg text-left cursor-pointer hover:bg-[var(--surface-2)]"
                  onMouseDown={(e) => { e.preventDefault(); ui.abrirFicha(l.id, rectDe(e.currentTarget)); setQ(""); setAberta(false); }}>
                  <Avatar nome={l.nome} size={28} /><span className="flex-1 min-w-0"><span className="block truncate font-medium">{l.nome}</span><span className="text-[12px]" style={{ color: "var(--muted)" }}>{l.tel}</span></span>
                  <EtapaPill id={l.etapa} />
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Shell() {
  const { criar } = useCRM();
  const [view, setView] = useState<View>(lerHash);
  const [ficha, setFicha] = useState<{ id: string; origem: Rect | null; foco?: "nome" } | null>(null);
  const [conversaId, setConversaId] = useState<string | null>(null);

  useEffect(() => {
    const h = () => setView(lerHash());
    window.addEventListener("hashchange", h); return () => window.removeEventListener("hashchange", h);
  }, []);

  const ir = useCallback((v: View) => { if (location.hash !== `#${v}`) location.hash = v; setView(v); window.scrollTo({ top: 0 }); }, []);
  const abrirFicha = useCallback((id: string, origem?: Rect | null, foco?: "nome") => setFicha({ id, origem: origem ?? null, foco }), []);
  const abrirConversa = useCallback((id: string) => { setFicha(null); setConversaId(id); ir("conversas"); }, [ir]);
  const novoContato = useCallback(() => { const id = criar({}); setFicha({ id, origem: null, foco: "nome" }); }, [criar]);

  const ui = useMemo(() => ({ view, ir, abrirFicha, abrirConversa, conversaId, setConversaId, novoContato }), [view, ir, abrirFicha, abrirConversa, conversaId, novoContato]);
  const Tela = TELAS[view];

  return (
    <UICtx.Provider value={ui}>
      <div className="flex h-full">
        <Sidebar />
        <div className="flex-1 min-w-0 h-full overflow-y-auto scroll-thin" id="conteudo">
          <header className="sticky top-0 z-20 flex items-center gap-3 py-3"
            style={{ background: "color-mix(in srgb, var(--bg) 86%, transparent)", backdropFilter: "blur(10px)", paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))", paddingTop: "max(12px, env(safe-area-inset-top))" }}>
            <div className="md:hidden rounded-xl p-1.5" style={{ background: "var(--side)" }}><Marca compacta /></div>
            <Busca />
            <span className="hidden lg:inline-flex chip ml-auto" title="Os dados desta versão são fictícios">Demonstração · dados fictícios</span>
            <div className="md:hidden ml-auto"><BotaoTema claro /></div>
            <button type="button" className="btn btn-gold" onClick={novoContato}><UserPlus size={16} /><span className="hidden sm:inline">Novo contato</span></button>
          </header>
          <main className="pt-3 pb-28 md:pb-10" style={{ paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))" }}>
            <div className="md:px-4">
              <AnimatePresence mode="wait">
                <motion.div key={view} initial={{ opacity: 0, y: 14, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                  transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}>
                  <Tela />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
      <AnimatePresence>
        {ficha && <Ficha key={ficha.id} id={ficha.id} origem={ficha.origem} foco={ficha.foco} onClose={() => setFicha(null)} />}
      </AnimatePresence>
    </UICtx.Provider>
  );
}

export default function App() {
  return <CRMProvider><Shell /></CRMProvider>;
}
