"use client";
import { AnimatePresence, motion } from "motion/react";
import { Download, Share, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

// Media query reativa: o celular ganha componentes próprios, não só CSS encolhido.
export function useMq(q: string) {
  return useSyncExternalStore(
    (cb) => { const m = matchMedia(q); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => matchMedia(q).matches,
    () => false,
  );
}
export const useCelular = () => useMq("(max-width: 767px)");

export function registrarSW() {
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => {});
}

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let guardado: PromptEvent | null = null;
const ouvintes = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); guardado = e as PromptEvent; ouvintes.forEach((f) => f()); });
  window.addEventListener("appinstalled", () => { guardado = null; ouvintes.forEach((f) => f()); });
}

// Android/Chrome: o navegador avisa que dá pra instalar (beforeinstallprompt) e a gente mostra o botão.
// iPhone: o Safari não tem esse evento, então a instalação é pelo menu Compartilhar.
export function useInstalar() {
  const [, forcar] = useState(0);
  useEffect(() => { const f = () => forcar((n) => n + 1); ouvintes.add(f); return () => { ouvintes.delete(f); }; }, []);
  const instalado = typeof window !== "undefined" && (matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const ios = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  return {
    instalado, ios, pode: !!guardado,
    instalar: async () => { if (!guardado) return; await guardado.prompt(); await guardado.userChoice; guardado = null; forcar((n) => n + 1); },
  };
}

export function AvisoInstalar() {
  const { instalado, ios, pode, instalar } = useInstalar();
  const [fechado, setFechado] = useState(() => { try { return localStorage.getItem("cmc-pwa-aviso") === "1"; } catch { return false; } });
  const mostrar = !instalado && !fechado && (pode || ios);
  const fechar = () => { setFechado(true); try { localStorage.setItem("cmc-pwa-aviso", "1"); } catch {} };
  return (
    <AnimatePresence>
      {mostrar && (
        <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden overflow-hidden">
          <div className="flex items-center gap-3 rounded-2xl p-3 mb-4" style={{ background: "var(--gold-soft)", border: "1px solid color-mix(in srgb, var(--gold) 30%, transparent)" }}>
            <img src="/icon-192.png" alt="" className="w-11 h-11 rounded-xl flex-none" />
            <div className="flex-1 min-w-0 text-[13px] leading-snug">
              <div className="font-medium">Instale o CRM no celular</div>
              {ios && !pode
                ? <div style={{ color: "var(--muted)" }}>Toque em <Share size={12} className="inline -mt-0.5" /> Compartilhar e depois em “Adicionar à Tela de Início”.</div>
                : <div style={{ color: "var(--muted)" }}>Abre em tela cheia, como um app, e funciona sem internet.</div>}
            </div>
            {pode && <button type="button" className="btn btn-gold !px-3 !py-2" onClick={instalar}><Download size={15} />Instalar</button>}
            <button type="button" className="p-1.5 cursor-pointer" onClick={fechar} aria-label="Dispensar aviso"><X size={16} style={{ color: "var(--muted)" }} /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
