"use client";
import { AnimatePresence, motion } from "motion/react";
import { BellRing, Bot, Building2, Columns3, Database, Download, MessageSquareReply, Palette, RotateCcw, ShieldCheck, Smartphone, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, Cabecalho, TagChip } from "@/components/bits";
import { BotaoTema } from "@/components/Sidebar";
import { useInstalar } from "@/lib/pwa";
import { preencher, useCRM } from "@/lib/store";
import { EQUIPE, ETAPAS, OPTIN_NOME, etapa, type Config } from "@/lib/types";

function exportarCSV(linhas: string[][], nome: string) {
  const csv = linhas.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const SECOES = [
  { id: "clinica", nome: "Clínica", Icon: Building2 },
  { id: "whatsapp", nome: "WhatsApp", Icon: Smartphone },
  { id: "lembretes", nome: "Lembretes", Icon: BellRing },
  { id: "auto", nome: "Respostas automáticas", Icon: MessageSquareReply },
  { id: "ia", nome: "Sugestões com IA", Icon: Sparkles },
  { id: "funil", nome: "Funil e etiquetas", Icon: Columns3 },
  { id: "equipe", nome: "Equipe", Icon: Users },
  { id: "privacidade", nome: "Privacidade", Icon: ShieldCheck },
  { id: "aparencia", nome: "Aparência", Icon: Palette },
  { id: "dados", nome: "Dados", Icon: Database },
] as const;
type Secao = (typeof SECOES)[number]["id"];

// Campo que salva ao sair dele, como no resto do sistema
function Campo({ id, label, valor, onSalvar, area, dica }: { id: string; label: string; valor: string; onSalvar: (v: string) => void; area?: boolean; dica?: string }) {
  const [v, setV] = useState(valor);
  useEffect(() => setV(valor), [valor]);
  const props = { id, className: "field", value: v, onChange: (e: { target: { value: string } }) => setV(e.target.value), onBlur: () => v !== valor && onSalvar(v) };
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      {area ? <textarea rows={3} {...props} /> : <input {...props} />}
      {dica && <p className="text-[12px] mt-1 mb-0" style={{ color: "var(--muted)" }}>{dica}</p>}
    </div>
  );
}

function Liga({ id, on, onChange, label }: { id: string; on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button id={id} type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center gap-3 cursor-pointer text-left">
      <span className="w-10 h-6 rounded-full p-0.5 flex transition-colors" style={{ background: on ? "var(--gold-btn)" : "var(--line-2)", justifyContent: on ? "flex-end" : "flex-start" }}>
        <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 34 }} className="w-5 h-5 rounded-full" style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }} />
      </span>
      <span className="text-[13.5px]">{label}</span>
    </button>
  );
}

function Bloco({ titulo, desc, children }: { titulo: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="panel p-5 flex flex-col gap-4">
      <div><h2 className="eyebrow !text-[var(--ink)] m-0">{titulo}</h2>{desc && <p className="text-[13px] mt-1 mb-0" style={{ color: "var(--muted)" }}>{desc}</p>}</div>
      {children}
    </section>
  );
}

export function Ajustes() {
  const { leads, tags, config, setConfig, resetar } = useCRM();
  const [secao, setSecao] = useState<Secao>("clinica");
  const [confirmar, setConfirmar] = useState(false);
  const pwa = useInstalar();
  const set = (c: Partial<Config>) => setConfig(c);
  const optin = { sim: leads.filter((l) => l.optin === "sim").length, pendente: leads.filter((l) => l.optin === "pendente").length, nao: leads.filter((l) => l.optin === "nao").length };
  const exemplo = { nome: "Camila Weber", interesse: "Emagrecimento", consulta: new Date().setHours(14, 0, 0, 0) };

  const conteudo: Record<Secao, React.ReactNode> = {
    clinica: (
      <Bloco titulo="Dados da clínica" desc="Usados nas mensagens para as pacientes. Salva quando você sai do campo.">
        <div className="grid sm:grid-cols-2 gap-3">
          <Campo id="cfg-nome" label="Nome" valor={config.clinica} onSalvar={(v) => set({ clinica: v })} />
          <Campo id="cfg-tel" label="WhatsApp da recepção" valor={config.telefone} onSalvar={(v) => set({ telefone: v })} />
          <Campo id="cfg-end" label="Endereço" valor={config.endereco} onSalvar={(v) => set({ endereco: v })} dica="Aparece nas confirmações de consulta presencial." />
          <Campo id="cfg-hor" label="Horário de atendimento" valor={config.horario} onSalvar={(v) => set({ horario: v })} />
        </div>
      </Bloco>
    ),
    whatsapp: (
      <Bloco titulo="Conexão com o WhatsApp" desc="Na versão contratada, o número da clínica é ligado pela API oficial do WhatsApp (Meta). Toda a equipe responde pelo mesmo número.">
        <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
          <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}><Smartphone size={18} /></span>
          <div className="flex-1"><div className="font-medium">{config.telefone}</div><div className="text-[12.5px]" style={{ color: "var(--muted)" }}>{config.clinica} · conta comercial</div></div>
          <span className="tag tag-cinza">Simulado na demo</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {(["sim", "pendente", "nao"] as const).map((k) => (
            <div key={k} className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}><div className="display text-[26px] num">{optin[k]}</div><div className="text-[12px]" style={{ color: "var(--muted)" }}>{OPTIN_NOME[k]} receber mensagens</div></div>
          ))}
        </div>
      </Bloco>
    ),
    lembretes: (
      <Bloco titulo="Lembrete de consulta" desc="Enviado antes da consulta, com botão para a paciente confirmar.">
        <div>
          <label className="label" htmlFor="cfg-lemh">Enviar com antecedência de</label>
          <select id="cfg-lemh" className="field !w-auto" value={config.lembreteHoras} onChange={(e) => set({ lembreteHoras: Number(e.target.value) })}>
            {[2, 12, 24, 48].map((h) => <option key={h} value={h}>{h} horas</option>)}
          </select>
        </div>
        <Campo id="cfg-lemt" label="Mensagem" area valor={config.textoLembrete} onSalvar={(v) => set({ textoLembrete: v })} dica="Use {{nome}} e {{hora}}." />
        <div className="rounded-xl p-3 text-[13px] max-w-[360px] self-end" style={{ background: "var(--gold-soft)", borderRadius: "14px 14px 4px 14px" }}>{preencher(config.textoLembrete, exemplo)}</div>
      </Bloco>
    ),
    auto: (
      <Bloco titulo="Fora do horário" desc="Quando alguém escreve fora do horário de atendimento, recebe esta resposta na hora.">
        <Liga id="cfg-auto" on={config.autoResposta} onChange={(v) => set({ autoResposta: v })} label="Responder automaticamente fora do horário" />
        <Campo id="cfg-autot" label="Mensagem" area valor={config.textoAuto} onSalvar={(v) => set({ textoAuto: v })} />
      </Bloco>
    ),
    ia: (
      <Bloco titulo="Sugestões de resposta com IA" desc="Quando uma paciente manda mensagem, o sistema sugere três respostas. A recepção escolhe, edita e envia; nada sai sozinho.">
        <Liga id="cfg-ia" on={config.sugestoesIA} onChange={(v) => set({ sugestoesIA: v })} label="Mostrar sugestões nas conversas" />
        <div className="rounded-xl p-3 text-[13px] flex gap-3" style={{ background: "var(--surface-2)" }}>
          <Bot size={18} className="flex-none" style={{ color: "var(--gold-ink)" }} />
          <div>Modelo Llama 3.3 70B, gratuito pela Groq. Ele conhece só as informações da clínica (áreas, convênio, consulta online, horário). Não dá orientação médica, não inventa preço ou horário e, em sinal de urgência, orienta procurar atendimento.</div>
        </div>
      </Bloco>
    ),
    funil: (
      <>
        <Bloco titulo="Etapas do funil" desc="Definidas com a Dra Cintia a partir de como a recepção já trabalha.">
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
        </Bloco>
        <Bloco titulo="Etiquetas" desc="Crie novas direto na ficha de qualquer paciente.">
          <div className="flex flex-wrap gap-2">{tags.map((t) => <span key={t.nome} className="flex items-center gap-1.5"><TagChip nome={t.nome} /><span className="num text-[11.5px]" style={{ color: "var(--muted)" }}>{leads.filter((l) => l.tags.includes(t.nome)).length}</span></span>)}</div>
        </Bloco>
      </>
    ),
    equipe: (
      <Bloco titulo="Equipe" desc="Cada pessoa tem seu login. As conversas podem ser atribuídas a quem vai responder.">
        {EQUIPE.map((e) => (
          <div key={e.id} className="flex items-center gap-3">
            <Avatar nome={e.nome} />
            <div className="flex-1"><div className="font-medium">{e.nome}</div><div className="text-[12.5px]" style={{ color: "var(--muted)" }}>{e.papel}</div></div>
            <span className="chip">{leads.filter((l) => l.responsavel === e.id && !l.resolvida && l.msgs.length).length} conversas abertas</span>
          </div>
        ))}
      </Bloco>
    ),
    privacidade: (
      <Bloco titulo="Privacidade e LGPD" desc="Dados de saúde são dados sensíveis pela LGPD (art. 11). Na versão contratada:">
        <ul className="m-0 pl-5 text-[13.5px] flex flex-col gap-1.5">
          <li>Login individual e cada pessoa vê só o que precisa.</li>
          <li>Banco de dados com backup diário e acesso registrado.</li>
          <li>Campanhas só vão para quem aceitou receber mensagens.</li>
          <li>A IA recebe só o trecho da conversa necessário para sugerir a resposta, sem prontuário.</li>
          <li>A paciente pode pedir para ver ou apagar os dados dela.</li>
        </ul>
      </Bloco>
    ),
    aparencia: (
      <>
        <Bloco titulo="Aparência" desc="Tema claro ou escuro, salvo neste navegador.">
          <div><BotaoTema claro /></div>
        </Bloco>
        <Bloco titulo="App no celular e no computador" desc="O CRM pode ser instalado como app: abre em tela cheia, ganha ícone e funciona sem internet.">
          {pwa.instalado ? <span className="tag tag-salvia self-start">Instalado neste aparelho</span>
            : pwa.pode ? <button type="button" className="btn btn-gold self-start" onClick={pwa.instalar}><Download size={15} />Instalar o app</button>
            : pwa.ios ? <p className="text-[13px] m-0">No iPhone: toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p>
            : <p className="text-[13px] m-0" style={{ color: "var(--muted)" }}>No Chrome ou Edge, use o ícone de instalar na barra de endereço. No iPhone, Compartilhar → “Adicionar à Tela de Início”.</p>}
        </Bloco>
      </>
    ),
    dados: (
      <Bloco titulo="Dados" desc="Versão de demonstração: os dados ficam salvos só neste navegador.">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn" onClick={() => exportarCSV([
            ["Nome", "WhatsApp", "E-mail", "Etapa", "Interesse", "Origem", "Etiquetas", "Valor", "Consentimento"],
            ...leads.map((l) => [l.nome, l.tel, l.email, etapa(l.etapa).nome, l.interesse, l.origem, l.tags.join(", "), String(l.valor || ""), OPTIN_NOME[l.optin]]),
          ], "pacientes-cintia-machado.csv")}><Download size={15} />Exportar pacientes (CSV)</button>
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
      </Bloco>
    ),
  };

  return (
    <div>
      <Cabecalho eyebrow={config.clinica} titulo="Ajustes" />
      <div className="grid md:grid-cols-[220px_minmax(0,1fr)] gap-5 items-start max-w-[1060px]">
        <nav className="flex md:flex-col gap-1 overflow-x-auto scroll-thin md:sticky md:top-20" aria-label="Seções dos ajustes">
          {SECOES.map(({ id, nome, Icon }) => (
            <button key={id} type="button" onClick={() => setSecao(id)} aria-current={secao === id ? "page" : undefined}
              className="relative flex-none flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] text-left cursor-pointer" style={{ color: secao === id ? "var(--ink)" : "var(--muted)" }}>
              {secao === id && <motion.span layoutId="ajuste-sel" className="absolute inset-0 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }} transition={{ type: "spring", stiffness: 480, damping: 36 }} />}
              <Icon size={16} className="relative" /><span className="relative whitespace-nowrap">{nome}</span>
            </button>
          ))}
        </nav>
        <AnimatePresence mode="wait">
          <motion.div key={secao} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="flex flex-col gap-4 min-w-0">
            {conteudo[secao]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
