# AgendaClick — Documento de Handoff para IA

> **Data:** 06/07/2026  
> **Líder do projeto:** Gustavo  
> **Parceiro comercial:** Miguel (vendas)  
> **Palavra-chave de verificação:** Batata  
> **Repositório:** https://github.com/PrCee/Barbearia  
> **Deploy:** https://agendaclick-gamma.vercel.app

---

## 1. Visão do Produto

SaaS white-label de agendamento para barbearias. O cliente final agenda via link direto com mínimo de cliques (apenas Nome e WhatsApp). Cada barbearia tem sua própria página personalizada com tema escolhido pelo dono.

**URL pública de exemplo:** https://agendaclick-gamma.vercel.app/barber-shop

---

## 2. Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Linguagem | TypeScript (strict) |
| Banco | PostgreSQL via Vercel Postgres (Neon) |
| ORM | Prisma v7.8 (custom output em `src/generated/prisma`) |
| Adapter DB | `@prisma/adapter-pg` + `pg` (funciona mas é lento em serverless) |
| Auth | NextAuth.js v5 beta (`next-auth@5.0.0-beta.31`) |
| Estilo | TailwindCSS v4 |
| Testes | vitest + @testing-library/react |
| Error Handling | neverthrow (Result<T, E>) |
| Logs | pino |
| Senhas | bcryptjs |
| Hospedagem | Vercel (Hobby) |
| CI/CD | Auto-deploy via GitHub → Vercel |

---

## 3. Arquitetura do Código

### 3.1 Estrutura de Pastas

```
agendaclick/
├── prisma/
│   ├── schema.prisma          # 8 modelos do banco
│   ├── seed.ts                # Seed com dados de exemplo
│   └── migrations/            # Histórico de migrations
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Layout raiz com SessionProvider
│   │   ├── providers.tsx      # Client wrapper do SessionProvider
│   │   ├── page.tsx           # Landing page
│   │   ├── login/page.tsx     # Página de login
│   │   ├── temas/page.tsx     # Showcase de 8 temas
│   │   ├── [alias]/page.tsx   # Página de agendamento público (dinâmica)
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx     # Layout com sidebar (autenticado)
│   │   │   ├── logout-button.tsx
│   │   │   └── dashboard/
│   │   │       └── page.tsx   # Agenda do dia (visor mockado)
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       └── health/route.ts     # Endpoint de diagnóstico
│   ├── domain/
│   │   ├── entities/           # Tipos puros (Appointment, Shop, Barber, etc.)
│   │   └── errors.ts          # Tipos de erro do domínio (AppError)
│   ├── use-cases/
│   │   └── listavailableslotsusecase.ts  # Motor de grade dinâmica
│   ├── infra/
│   │   └── db/prisma.ts       # Singleton PrismaClient com adapter
│   └── lib/
│       ├── themes.ts           # 8 temas white-label (Noir, Midnight, etc.)
│       ├── auth.ts             # Config NextAuth com Credentials provider
│       ├── auth.config.ts      # Config base sem Prisma (Edge-safe)
│       ├── result.ts           # Wrapper neverthrow
│       └── logger.ts           # pino config
├── tests/
│   ├── setup.ts
│   └── unit/use-cases/
│       └── listavailableslotsusecase.test.ts  # 26 testes
├── middleware.ts               # Proteção de rotas /dashboard
├── vercel.json                 # Timeout 30s para APIs
├── vitest.config.ts
└── package.json
```

### 3.2 Regras de Ouro da Arquitetura

Estas regras são **mandatórias** — definidas pelo Gustavo para garantir código auditável por IA:

1. **Arquivos curtos**: Use Cases ~120 linhas, entidades ~80 linhas, controllers ~50 linhas
2. **Error as Value**: Toda função de negócio retorna `Result<T, AppError>` via neverthrow
3. **TDD**: Testes antes da implementação para o core (grade dinâmica, agendamento)
4. **Logs estruturados**: Todo erro inclui `{ event, userId, payload, reason }` via pino
5. **Modularidade extrema**: Use Cases isolados, sem dependência circular
6. **Na dúvida, pergunte ao Gustavo**: Não tomar decisões de arquitetura sozinho

---

## 4. Banco de Dados

### 4.1 Schema Prisma (8 modelos)

```prisma
Shop         (id, alias@unique, name, address, phone, logoUrl, theme, timestamps)
Barber       (id, shopId→Shop, name, email@unique, password?, image?, role, active)
Service      (id, shopId→Shop, name, durationMinutes, price, active)
BarberService (barberId+serviceId — chave composta)
Product      (id, shopId→Shop, name, price, imageUrl?, active)
WorkingHours (id, shopId→Shop, barberId→Barber, dayOfWeek, startTime, endTime, breakStart?, breakEnd?)
Client       (id, shopId→Shop, name, phone)
Appointment  (id, shopId→Shop, barberId→Barber, serviceId→Service, clientId→Client,
              date, startTime, endTime, status, observation?, totalPrice?, reminderSent)
AppointmentProduct (appointmentId+productId — chave composta)

🛡️ CONSTRAINT CRÍTICA: @@unique([barberId, date, startTime]) no Appointment
   → Previne double-booking no nível do banco
```

### 4.2 Conexão

- **DATABASE_URL:** Configurada no `.env` local e nas env vars da Vercel. Obter do Vercel dashboard.
- **Host:** db.prisma.io (Prisma Data Platform, backend do Vercel Postgres)
- **Adapter:** `@prisma/adapter-pg` com `pg` (node-postgres)
- **Seed:** `npx tsx --env-file=.env prisma/seed.ts`
- **Migrate:** `npx prisma migrate dev`

### 4.3 Dados de Seed

| Entidade | Dados |
|---|---|
| Shop | "Barber Shop", alias `barber-shop`, tema `amber` |
| Admin | `admin@barbershop.com` / `123456`, role="admin" |
| Barbeiros | `alexandre@barbershop.com`, `bruno@barbershop.com` / `123456` |
| Serviços | Barba (30min/R$35), Corte Degradê (45min/R$50), Barba+Corte (60min/R$75) |
| Expediente | Seg-Sex 08:00-18:00, almoço 12:00-13:00 |

---

## 5. O que Está Funcionando

| Funcionalidade | Status | Observação |
|---|---|---|
| Página de agendamento público (`/[alias]`) | ✅ | Mockado, 3 shops demo (barber-shop, barbearia-premium, urban-cut) |
| Showcase de temas (`/temas`) | ✅ | 8 temas com preview ao vivo |
| Landing page (`/`) | ✅ | Links para demo e showcase |
| Motor de grade dinâmica | ✅ | 26 testes passando |
| Build + Deploy automático | ✅ | GitHub → Vercel, TypeScript compila sem erros |
| Banco de dados + Seed | ✅ | Migrations aplicadas, seed rodou |
| Health check (`/api/health`) | ✅ | Conexão com banco confirmada |
| NextAuth config | ✅ | Credentials provider, JWT, middleware Edge-safe |
| Layout dashboard | ✅ | Sidebar + header, mobile responsive |

---

## 6. O que NÃO Está Funcionando / Precisa de Atenção

### ⚠️ Login (BUG ATIVO)

**Sintoma:** Ao clicar "Entrar" na página `/login`, nada acontece visualmente. O backend responde mas com timeout no ambiente serverless.

**Causa provável:** O `@prisma/adapter-pg` + `pg` (TCP) tem cold start muito lento (~8-12s) no ambiente serverless da Vercel. Combinado com `bcryptjs.compare()` (~1-2s), o tempo total pode exceder o timeout.

**Possíveis soluções:**
1. Trocar para `@prisma/adapter-neon` + `@neondatabase/serverless` (HTTP, mais rápido em serverless) — tentamos mas não funcionou com `db.prisma.io`
2. Verificar se o Vercel Postgres tem uma URL direta do Neon (sem `db.prisma.io`) para usar com adapter-neon
3. Usar `@vercel/postgres` nativo em vez de Prisma
4. Aumentar o plano Vercel (Pro) para ter mais tempo de execução
5. Migrar para Railway/Supabase com conexão TCP normal

### 🔲 Funcionalidades Pendentes

| O que | Prioridade |
|---|---|
| CRUD de barbeiros (`/dashboard/barbers`) | Alta |
| CRUD de serviços (`/dashboard/services`) | Alta |
| Configurações da barbearia (`/dashboard/settings`) — tema, nome, endereço | Alta |
| `CreateAppointmentUseCase` com proteção de concorrência | Alta |
| Conectar página `/[alias]` ao banco real (substituir mock) | Alta |
| `GetBarberScheduleUseCase` para dashboard | Alta |
| `RegisterBarberUseCase`, `CreateServiceUseCase`, `SetWorkingHoursUseCase` | Média |
| Página de agendamento mostrar agenda real (sem dados de clientes) | Média |
| Lembretes WhatsApp (Evolution API) | Baixa |
| PIX/Mercado Pago | MVP futuro |

---

## 7. Sistema de Temas White-Label

8 temas disponíveis, cada barbearia escolhe no painel admin:

```
noir     → Preto absoluto, elegância máxima
midnight → Azul profundo, sofisticação noturna
bordeaux → Vinho escuro, toque europeu
forest   → Verde musgo, natural e acolhedor
amber    → Âmbar quente, barbearia premium
ocean    → Azul oceano, calmo e moderno
slate    → Cinza urbano com violeta
mono     → Monocromático, minimalismo puro
```

Definidos em `src/lib/themes.ts`. Cada tema é um objeto `ThemeConfig` com classes Tailwind (bg, surface, border, primary, text, etc.). A página `/[alias]` aplica o tema dinamicamente via `getTheme(shop.theme)`.

---

## 8. Credenciais e Configurações

### GitHub
- **Repo:** https://github.com/PrCee/Barbearia
- **Git config:** user.name=PrCee, user.email=marquesgustavo001@hotmail.com
- **Auth:** Windows Credential Manager (já autenticado)

### Vercel
- **Projeto:** `prcees-projects/agendaclick`
- **Domínio:** https://agendaclick-gamma.vercel.app
- **Env vars configuradas:** DATABASE_URL, AUTH_SECRET
- **Build:** Automático no push da branch master
- **Timeout APIs:** 30s (configurado em vercel.json)
- **CLI token:** (disponível no ambiente — usar `vercel --token <token>` ou login interativo)

### Banco de Dados
- **DATABASE_URL:** Configurada no Vercel e no `.env` local. Obter do dashboard Vercel → Storage → agendaclick → .env.local
- **Plataforma:** Vercel Postgres (Neon via Prisma Data Platform)
- **Migrations:** Rodadas até `20260706205823_init`

---

## 9. Comandos Úteis

```bash
# Dev
cd agendaclick
npm run dev           # Next.js dev server
npm test              # vitest (26 testes)
npm run build         # Build de produção

# Banco de dados
npx prisma generate   # Regenera cliente Prisma
npx prisma migrate dev --name <nome>  # Nova migration
npx tsx --env-file=.env prisma/seed.ts  # Rodar seed

# Deploy
git push origin master  # Dispara deploy automático na Vercel
vercel --prod --yes      # Deploy manual

# Vercel logs
vercel logs https://agendaclick-gamma.vercel.app --since 30m
```

---

## 10. Decisões de Arquitetura Registradas

1. **Stack:** Next.js + TypeScript + PostgreSQL + Prisma + Tailwind (escolha do Caju, aprovada pelo Gustavo)
2. **Onboarding:** Manual — Gustavo/Miguel cadastram barbearias (não self-service)
3. **WhatsApp:** Evolution API (open source, self-hosted) — postergado
4. **Pagamento:** Fora do MVP — postergado
5. **Hospedagem:** Vercel (front+API) + Vercel Postgres (banco)
6. **Autenticação:** NextAuth v5 com Credentials (email+senha), sem OAuth
7. **Temas:** 5→8 temas predefinidos (não customização livre de cores)
8. **URLs:** `/[alias]` (subpath, não subdomínio — decisão inicial, pode mudar)
9. **Prisma v7:** Requer adapter explícito no construtor (mudança da v6)

---

## 11. Notas para a Próxima IA

1. **O Gustavo é autista e valoriza comunicação direta e honesta.** Nada de enrolação ou falsa positividade. Ele é dev com background em infra (suporte→SOC/NOC), quase formado em ADS. Hoje trabalha como porteiro e precisa desse projeto como fonte de renda.

2. **O Miguel é o parceiro comercial.** Não é dev, fez o protótipo original em agendaclick.com.br/barber-shop (Laravel+jQuery via vibe coding). Ele cuida das vendas. O Gustavo cuida da parte técnica.

3. **Regra de ouro: código precisa ser mantível por qualquer IA.** Use Cases isolados de ~100 linhas, testes como documentação, Error as Value (neverthrow), logs estruturados (pino). Se um arquivo passar de 150 linhas, quebre em mais use-cases.

4. **Nunca tome decisões de arquitetura sem validar com o Gustavo.** Ele prefere ser consultado do que receber surpresas.

5. **O login está com bug** — é o primeiro item a resolver. A conexão com o banco funciona (health check retorna 200), mas a função de login é muito lenta no ambiente serverless.

6. **Os arquivos de workspace estão em:** `C:\Users\PrC\.openclaw-autoclaw\workspace\` (AGENTS.md, SOUL.md, USER.md, IDENTITY.md, TOOLS.md, agendaclick-architecture.md)

7. **O Gustavo prefere ser chamado de Gustavo.** A IA anterior se chamava Caju 🥜 — ele não nomeou, mas aceitou.

---

*Fim do handoff. Este documento contém tudo que a próxima IA precisa saber para continuar o desenvolvimento sem perder contexto.*
