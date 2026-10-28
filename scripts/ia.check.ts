// Checagem das sugestões locais (sem IA): `node --experimental-strip-types scripts/ia.check.ts`
import assert from "node:assert/strict";
import { sugestoesLocais } from "../src/lib/ia.ts";

const agora = new Date("2026-10-27T12:00:00").getTime();
const conv = (texto: string, etapa = "novo", de: "p" | "c" = "p", extra = {}) =>
  ({ nome: "Camila Weber", etapa: etapa as never, msgs: [{ id: "1", t: agora - 3600e3, de, texto }], ...extra });

const preco = sugestoesLocais(conv("Quanto custa a consulta? Aceita cartão?"), agora);
assert.equal(preco.sugestoes[0].rotulo, "Enviar valores");
assert.ok(preco.sugestoes[0].texto.includes("[valor]"), "nunca inventa preço");
assert.equal(preco.etapa, "protocolo");

const urg = sugestoesLocais(conv("Estou com dor forte no peito"), agora);
assert.equal(urg.sugestoes[0].rotulo, "Orientar urgência");
assert.ok(urg.sugestoes[0].texto.includes("192"));

// Clínica falou por último, consulta marcada: nada de "obrigada pela mensagem", e sim confirmar a consulta
const isadora = sugestoesLocais(conv("Isadora, tudo certo para quinta às 11h", "agendado", "c",
  { nome: "Isadora Meyer", consulta: agora + 2 * 864e5, modalidade: "Presencial", confirmada: false }), agora);
assert.equal(isadora.sugestoes.length, 4, "sempre 4 opções");
assert.ok(isadora.sugestoes.every((s) => !/obrigada pela mensagem/i.test(s.texto)), "não agradece mensagem que não veio");
assert.equal(isadora.sugestoes[0].rotulo, "Confirmar presença");
assert.ok(isadora.sugestoes.every((s) => s.texto.includes("Isadora")), "usa o primeiro nome");

assert.equal(sugestoesLocais(conv("quero agendar", "retorno"), agora).etapa, "agendar");
assert.ok(sugestoesLocais(conv("oi"), agora).sugestoes.length >= 3, "mesmo sem palavra-chave, várias opções");
console.log("ia ok");
