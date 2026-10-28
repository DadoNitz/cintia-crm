// Checagem das sugestões locais (sem IA): `node --experimental-strip-types scripts/ia.check.ts`
import assert from "node:assert/strict";
import { sugestoesLocais } from "../src/lib/ia.ts";

const conv = (texto: string, etapa = "novo") => ({ nome: "Camila Weber", etapa: etapa as never, msgs: [{ id: "1", t: 0, de: "p" as const, texto }] });

const preco = sugestoesLocais(conv("Quanto custa a consulta? Aceita cartão?"));
assert.equal(preco.sugestoes[0].rotulo, "Enviar valores");
assert.ok(preco.sugestoes[0].texto.includes("[valor]"), "nunca inventa preço");
assert.equal(preco.etapa, "protocolo");

const urg = sugestoesLocais(conv("Estou com dor forte no peito"));
assert.equal(urg.sugestoes[0].rotulo, "Orientar urgência");
assert.ok(urg.sugestoes[0].texto.includes("192"));

const qualquer = sugestoesLocais(conv("oi"));
assert.equal(qualquer.sugestoes.length, 2, "sem palavra-chave: só as respostas gerais");
assert.ok(qualquer.sugestoes.every((s) => s.texto.includes("Camila")), "usa o primeiro nome");

assert.equal(sugestoesLocais(conv("quero agendar", "retorno")).etapa, "agendar");
console.log("ia ok");
