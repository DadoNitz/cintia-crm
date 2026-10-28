# CRM · Cintia Machado Clinic

CRM da recepção da Cintia Machado Clinic, feito pela [Sartor](https://sartordigital.com).

**Telas:**
- **Painel:** fluxo do dia (esperadas → recepção → consulta → atendidas, com check-in/chamar/finalizar), WhatsApp esperando resposta, lembretes de amanhã, conversão, funil e gráficos.
- **Funil de pacientes:** kanban com arrastar e soltar com física.
- **Conversas:** inbox do WhatsApp com responsável, assunto, urgente, resolvidas, modelos com `/` e **sugestões de resposta por IA**.
- **Pacientes:** tabela com filtros por etapa, etiqueta e consentimento do WhatsApp.
- **Agenda:** dias, linha do tempo com status, ocupação e envio de lembretes.
- **Campanhas:** disparos para um público filtrado (só quem aceitou mensagens), agendamento, prévia, métricas de entrega/leitura/resposta e modelos aprovados pela Meta.
- **Relatórios:** faltas antes/depois dos lembretes, funil dos lembretes, consultas por semana, funil de vendas, procura por área e horários mais cheios.
- **Pendências da Dra** e **Ajustes** (clínica, WhatsApp, lembretes, resposta automática, IA, funil, equipe, privacidade, aparência, dados).

Cada paciente tem uma ficha com dados, consentimento, etiquetas, histórico, anotações e conversa.

## Sugestões com IA

`src/app/api/sugestoes/route.ts` chama o **GPT-OSS 120B** (com Qwen de reserva) no plano gratuito da [Groq](https://console.groq.com) (API compatível com a da OpenAI). O prompt de sistema tem só as informações públicas da clínica e as regras: não dar orientação médica, não inventar preço/horário, orientar urgência.

- A chave fica só no servidor: crie `GROQ_API_KEY` nas variáveis de ambiente da Vercel (ou em `.env.local`).
- Sem chave, o chat usa sugestões locais por palavra-chave (`src/lib/ia.ts`), então a demo funciona igual.
- A IA só sugere; a recepção escolhe, edita e envia.

## Rodar

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run check    # checa a transição de tema e as sugestões locais
```

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, Motion (animações), lucide-react (ícones).

## Estado atual: demonstração

- Os dados são **fictícios** e ficam salvos no `localStorage` do navegador (`src/lib/store.tsx`).
- O WhatsApp é **simulado**: ao enviar uma mensagem, a paciente "responde" sozinha depois de ~3 s; lembretes e campanhas também simulam entrega, leitura e resposta.
- Fora do horário da clínica, o quadro do dia é montado como se fossem 11h10 (`agoraClinica` em `src/lib/seed.ts`).
- Os gráficos de faltas e consultas dos Relatórios usam números de exemplo fixos.

## Próximo passo (versão contratada)

1. Trocar o `localStorage` por Supabase (Postgres + Auth), com RLS por usuário da clínica.
2. Ligar a WhatsApp Cloud API: webhook de mensagens recebidas criando/atualizando a paciente e o envio saindo pelo número da clínica.
3. Termo de tratamento de dados (LGPD, dados de saúde são sensíveis) e backup diário.

## Onde está cada coisa

| Arquivo | O quê |
|---|---|
| `src/lib/types.ts` | Etapas do funil, origens, interesses, tipo `Lead` |
| `src/lib/seed.ts` | Pacientes de exemplo |
| `src/lib/store.tsx` | Estado global e ações (mover, enviar mensagem, etiquetas…) |
| `src/lib/liquid.ts` | Transição de tema "líquida" (View Transitions API) |
| `src/views/Funil.tsx` | Kanban com física no arrastar |
| `src/components/Ficha.tsx` | Ficha da paciente |

## App no celular (PWA)

- `src/app/manifest.ts`: nome, ícones (gerados a partir do logo vetorizado), tela cheia, atalhos.
- `public/sw.js`: service worker. Páginas com rede primeiro e cache como reserva (abre offline); arquivos do build com cache primeiro; `/api` nunca é guardado.
- Instalar: no Android aparece o botão (evento `beforeinstallprompt`); no iPhone, Compartilhar → "Adicionar à Tela de Início".
- No celular o layout muda: funil por abas com deslizar o card para mudar de etapa, conversa em tela cheia (o voltar do Android fecha), pacientes em cards, fluxo do dia por abas, números em carrossel.
- `src/components/Logo.tsx`: logo da clínica em SVG, vetorizado da arte original.
- `src/components/Loader.tsx`: tela de carregamento, vem no HTML do servidor.
