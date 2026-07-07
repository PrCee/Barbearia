# AgendaClick ✂️

**AgendaClick** é um SaaS (Software as a Service) white-label de alto desempenho, desenhado exclusivamente para modernizar a gestão de barbearias. Construído sobre uma stack moderna e robusta, ele entrega uma experiência de usuário impecável, tanto para o barbeiro quanto para o cliente final.

O foco central do projeto é **zero atrito**: o cliente não precisa baixar nenhum aplicativo, realizar cadastros longos ou instalar nada. Tudo é acessado via link direto (web app responsivo), projetado com uma estética minimalista e premium (Apple-like aesthetics), garantindo agilidade e uma percepção de alto valor para o negócio.

---

## 🎯 Por que o AgendaClick?

- **Fricção Zero para o Cliente:** Agendamento rápido em menos de 4 cliques. O cliente acessa o link, escolhe o profissional, o serviço e a data no nosso *Calendário Mensal Nativo*, confirma os dados e a vaga está garantida.
- **Performance e Tempos de Resposta:** Arquitetura Serverless (Next.js na Vercel) combinada com PostgreSQL na nuvem (Neon Database), garantindo tempos de resposta na casa dos milissegundos para consultas de horários.
- **Prevenção de Conflitos Reais:** Sistema de bloqueio de horários projetado para lidar com *concurrency* — impossibilitando que dois clientes reservem o mesmo slot no mesmo segundo.
- **Design Premium & Minimalista:** Interface focada em usabilidade, *whitespace* inteligente e tipografia limpa. O sistema conta com 8 temas puros (Light e Dark) que o dono da barbearia pode trocar em tempo real no painel.

## 🛠️ Stack Tecnológica Sólida

O projeto foi construído pensando em escalabilidade, manutenção a longo prazo e segurança:

- **Framework Core:** [Next.js 14+ (App Router)](https://nextjs.org/) — Renderização híbrida (SSR e CSR) otimizada para SEO e performance de ponta.
- **Banco de Dados Relacional:** [PostgreSQL](https://www.postgresql.org/) hospedado no [Neon](https://neon.tech/) — Integridade relacional rigorosa, transações ACID e pooling de conexões otimizado para serverless.
- **ORM (Object-Relational Mapping):** [Prisma](https://www.prisma.io/) — Migrations seguras, validação de tipagem de ponta a ponta e consultas eficientes ao banco de dados.
- **Autenticação Segura:** [NextAuth.js v5](https://nextjs.org/docs/app/building-your-application/authentication) — Sessões baseadas em JWT, gerenciamento de rotas protegidas (Admin vs Barbeiros).
- **Estilização e Animação:** [Tailwind CSS v4](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) — Layouts modernos, transições fluidas e alta customização sem overhead de CSS.

## 📦 Funcionalidades Implementadas (MVP Consolidado)

1. **Dashboard Administrativo:**
   - Gestão de Profissionais (Adição, inativação, permissões).
   - Gestão de Serviços (Preços, tempo de duração).
   - Configuração de Identidade Visual da barbearia (Temas).
2. **Motor de Agendamento Inteligente:**
   - Leitura em tempo real do banco de dados filtrando dias passados e slots ocupados.
   - Respeita os horários e jornadas de cada barbearia/barbeiro rigorosamente.
3. **Plataforma Client-facing:**
   - Landing page com informações de localização via Google Maps.
   - Fluxo modal em "BottomSheet" para celular (sensação de App Nativo).
   - Vitrine de Assinatura VIP (suporte a Clube de Assinaturas).

## 🚀 Como iniciar o projeto localmente

Para rodar este ambiente em sua máquina e atestar a arquitetura:

1. Clone o repositório:
```bash
git clone https://github.com/PrCee/Barbearia.git
```
2. Instale as dependências:
```bash
npm install
```
3. Configure o arquivo `.env` com a string do banco PostgreSQL (`DATABASE_URL`).
4. Execute as migrações para sincronizar seu banco local:
```bash
npx prisma generate
npx prisma db push
```
5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador. O código-fonte reflete imediatamente qualquer mudança.

---

> *"Um software invisível é aquele que apenas funciona, entregando valor sem exigir que o usuário aprenda a usá-lo."* — A premissa do AgendaClick.
