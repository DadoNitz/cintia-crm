# CRM · Cintia Machado Clinic

CRM da recepção da Cintia Machado Clinic, feito pela [Sartor](https://sartordigital.com).

**Telas:** Painel (conversão, atenção, consultas), Funil de pacientes (kanban com arrastar e soltar), Conversas (inbox de WhatsApp), Pacientes, Agenda, Pendências da Dra e Ajustes. Cada paciente tem uma ficha com dados, etiquetas, histórico, anotações e conversa.

## Rodar

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run check    # checa o polígono da transição de tema
```

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, Motion (animações), lucide-react (ícones).

## Estado atual: demonstração

- Os dados são **fictícios** e ficam salvos no `localStorage` do navegador (`src/lib/store.tsx`).
- O WhatsApp é **simulado**: ao enviar uma mensagem, a paciente "responde" sozinha depois de ~3 s.

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
