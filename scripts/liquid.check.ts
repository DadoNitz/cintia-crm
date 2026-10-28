// Checagem rápida do polígono da transição de tema: `node scripts/liquid.check.ts`
import assert from "node:assert/strict";
import { poligonoLiquido } from "../src/lib/liquid.ts";

const pts = (s: string) => s.slice(8, -1).split(",").map((p) => p.trim().split(" ").map((v) => parseFloat(v)));
const inicio = pts(poligonoLiquido(100, 100, 0, 0));
assert.ok(inicio.every(([x, y]) => x === 100 && y === 100), "começa como um ponto no botão");
const fim = pts(poligonoLiquido(0, 0, 1000, 1));
assert.equal(fim.length, 64, "mesmo número de pontos em todos os quadros (senão o clip-path não interpola)");
assert.ok(fim.every(([x, y]) => Math.abs(Math.hypot(x, y) - 1000) < 0.2), "no último quadro é um círculo perfeito, sem onda");
console.log("liquid ok");
