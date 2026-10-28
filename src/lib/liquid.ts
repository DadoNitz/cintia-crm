// Troca de tema com uma "gota" que se espalha a partir do botão.
// Usa a View Transitions API: o navegador tira um print do tema antigo, aplica o novo,
// e nós animamos o clip-path do snapshot novo com um polígono de borda ondulada que cresce.
export type Tema = "light" | "dark";

export function temaAtual(): Tema {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function aplicar(t: Tema) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem("cmc-theme", t); } catch {}
}

const PONTOS = 64;
const QUADROS = 30;

export function poligonoLiquido(cx: number, cy: number, raio: number, p: number): string {
  const amp = 0.2 * Math.pow(1 - p, 0.8); // a onda some quando a gota cobre a tela
  const fase = p * 9;
  const pts: string[] = [];
  for (let i = 0; i < PONTOS; i++) {
    const a = (i / PONTOS) * Math.PI * 2;
    const onda = Math.sin(5 * a + fase) * 0.55 + Math.sin(9 * a - fase * 1.6) * 0.3 + Math.sin(3 * a + fase * 0.7) * 0.15;
    const r = Math.max(0, raio * (1 + amp * onda));
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)}px ${(cy + r * Math.sin(a)).toFixed(1)}px`);
  }
  return `polygon(${pts.join(",")})`;
}

export function trocarTema(proximo: Tema, cx: number, cy: number) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduzir) return aplicar(proximo);

  const vt = doc.startViewTransition(() => aplicar(proximo));
  vt.ready.then(() => {
    const W = innerWidth, H = innerHeight;
    const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.06;
    const frames: Keyframe[] = [];
    for (let k = 0; k <= QUADROS; k++) {
      const p = k / QUADROS;
      const ease = p * p * (3 - 2 * p); // devagar no início pra gota aparecer, rápido no meio
      frames.push({ clipPath: poligonoLiquido(cx, cy, R * ease, p) });
    }
    document.documentElement.animate(frames, { duration: 1300, easing: "linear", pseudoElement: "::view-transition-new(root)" });
  }).catch(() => {});
}
