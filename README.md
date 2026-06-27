# Walleo Eventos — Carteira Digital

Carteira digital para eventos: o frequentador recarrega saldo via **PIX**, monta pedidos
nos estabelecimentos do evento e gera um **QR Code** que o staff valida no balcão para
entregar o produto. Tudo lastreado por um **livro-razão (ledger) imutável** que mantém o
saldo coerente e auditável.

Construído com **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS 4**,
**Drizzle ORM** e **PostgreSQL**. A cobrança PIX é integrada via **Confrapix**.

> Projeto em fase de MVP/demo. A autenticação de cliente e de estabelecimento é
> simplificada (mock com sessão server-side real assinada por HMAC), pensada para
> demonstração — não para produção.

---

## Sumário

- [Principais funcionalidades](#principais-funcionalidades)
- [Arquitetura e conceitos](#arquitetura-e-conceitos)
- [Stack](#stack)
- [Começando](#começando)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Banco de dados](#banco-de-dados)
- [Scripts disponíveis](#scripts-disponíveis)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Rotas da aplicação (UI)](#rotas-da-aplicação-ui)
- [Referência da API](#referência-da-api)
- [Modelo de dados](#modelo-de-dados)
- [Integração PIX (Confrapix)](#integração-pix-confrapix)
- [Credenciais da demo](#credenciais-da-demo)
- [Notas de build e deploy](#notas-de-build-e-deploy)

---

## Principais funcionalidades

**Frequentador (cliente)**
- Login simplificado por código de acesso, com sessão em cookie HTTP-only assinado.
- Carteira por evento com **saldo disponível = saldo liquidado − valor reservado**.
- Recarga via **PIX** (QR Code + copia-e-cola), com confirmação por webhook.
- Catálogo de estabelecimentos e cardápios.
- Montagem de pedido e geração de **QR Code** para retirada.
- Histórico de pedidos e extrato da carteira.

**Estabelecimento (painel)**
- Login do portal do estabelecimento (`/painel`).
- Gestão de produtos do cardápio (criar, editar preço, ativar/desativar, remover).
- Leitura do **QR Code** do pedido (scanner via câmera) para **capturar** o pagamento e entregar.
- Listagem de pedidos do estabelecimento.

---

## Arquitetura e conceitos

O domínio foi modelado com três ideias centrais (ver `db/schema.ts`):

1. **Ledger como fonte da verdade.** Cada recarga e cada consumo é um *evento* registrado
   em `ledger_entries` (livro-razão imutável). O saldo em `wallets.balance_cents` é um valor
   **materializado para leitura**, sempre coerente com o ledger.

2. **Reserva + captura.** Um pedido nasce `pending` e **reserva** o valor
   (`wallets.reserved_cents`) sem debitar. O saldo disponível já reflete o pedido. Quando o
   staff bipa o QR, ocorre a **captura**: débito real do cliente + crédito lógico do
   estabelecimento, e o pedido vira `redeemed`. Se for cancelado ou expirar, a reserva é
   liberada e nenhum débito real acontece.

   ```
   pending ──(staff bipa o QR)──▶ redeemed   (débito + crédito; reserva vira liquidação)
      │
      ├──(cliente/sistema cancela)──▶ cancelled  (reserva liberada)
      └──(expira após ORDER_RESERVATION_MINUTES)──▶ expired  (reserva liberada)
   ```

3. **Idempotência.** Um índice único em `ledger_entries (reference_type, reference_id, entry_type)`
   garante, por exemplo, que confirmar a mesma recarga PIX duas vezes (webhook reentrante)
   **não credita em dobro**.

O crédito ao estabelecimento é **lógico** (registrado no ledger), não uma liquidação
financeira imediata.

---

## Stack

| Camada            | Tecnologia                                              |
| ----------------- | ------------------------------------------------------- |
| Framework         | Next.js 16 (App Router) + React 19                      |
| Linguagem         | TypeScript                                              |
| Estilo            | Tailwind CSS 4                                           |
| ORM / DB          | Drizzle ORM + PostgreSQL (`pg`)                          |
| PIX               | Confrapix (REST + webhook)                              |
| QR Code           | `qrcode` (geração) e `html5-qrcode` (leitura no painel) |
| Sessão            | Cookies HTTP-only assinados com HMAC (`node:crypto`)    |

---

## Começando

Pré-requisitos: **Node.js**, **npm** e uma instância **PostgreSQL** acessível.

1. **Instale as dependências**
   ```bash
   npm install
   ```

2. **Configure o ambiente** — crie um arquivo `.env` na raiz (veja
   [Variáveis de ambiente](#variáveis-de-ambiente)). No mínimo, `DATABASE_URL`.

3. **Prepare o banco** (cria o schema e popula dados de demonstração)
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```
   Abra [http://localhost:3000](http://localhost:3000).

   Para HTTPS local (útil para câmera/scanner e testes em celular):
   ```bash
   npm run dev:https
   ```

---

## Variáveis de ambiente

Defina-as em `.env` (não commitar valores reais).

### Banco de dados
| Variável        | Obrigatória | Descrição                                   |
| --------------- | ----------- | ------------------------------------------- |
| `DATABASE_URL`  | ✅          | String de conexão PostgreSQL.               |

### Integração PIX (Confrapix)
| Variável               | Obrigatória   | Padrão                                | Descrição                              |
| ---------------------- | ------------- | ------------------------------------- | -------------------------------------- |
| `CONFRAPIX_API_TOKEN`  | p/ recargas   | —                                     | Bearer token (somente servidor).       |
| `CONFRAPIX_BASE_URL`   | não           | `https://api.confrapix.com.br/api`    | Base da API.                           |

### Login do cliente (mock)
| Variável                   | Obrigatória | Padrão                    | Descrição                                         |
| -------------------------- | ----------- | ------------------------- | ------------------------------------------------- |
| `CUSTOMER_SESSION_SECRET`  | ✅ (≥16 ch) | —                         | Segredo HMAC da sessão. **Sem ele o login falha** (fail-closed). |
| `CUSTOMER_ACCESS_CODE`     | não         | `1234`                    | Código de acesso simulado.                        |
| `CUSTOMER_NAME`            | não         | `Gabriel Santos Padilha`  | Nome fixo do cliente da demo.                     |
| `CUSTOMER_CPF`             | não         | `06472394504`             | CPF do cliente da demo.                           |
| `CUSTOMER_WALLET_ID`       | não         | `wal_gabriel`             | ID da carteira da demo.                           |

### Portal do estabelecimento (mock)
| Variável                   | Obrigatória | Descrição                                                        |
| -------------------------- | ----------- | ---------------------------------------------------------------- |
| `MERCHANT_SESSION_SECRET`  | ✅          | Segredo HMAC da sessão do painel.                                |
| `MERCHANT_PORTAL_EMAIL`    | ✅          | E-mail de login do painel.                                       |
| `MERCHANT_PORTAL_PASSWORD` | ✅          | Senha de login do painel.                                        |
| `MERCHANT_PORTAL_SLUG`     | ✅          | Deve casar com um `merchants.slug` semeado (ex.: `palco-sunset`).|

---

## Banco de dados

O schema vive em `db/schema.ts` (Drizzle). Comandos via `drizzle-kit`:

```bash
npm run db:generate   # gera arquivos de migração a partir do schema
npm run db:migrate    # aplica as migrações
npm run db:push       # sincroniza o schema direto no banco (dev)
npm run db:studio     # abre o Drizzle Studio (UI do banco)
npm run db:seed       # popula evento, estabelecimentos e produtos da demo
```

O `db:seed` (`db/seed.ts`) cria o evento da demo (`evt_walleo_demo`), 4 estabelecimentos
(incluindo o **Bar Palco Sunset** com cardápio completo e fotos reais em `public/products/`)
e seus produtos. O seed é idempotente (usa *upsert*), então pode ser rodado novamente.

---

## Scripts disponíveis

| Script             | Descrição                                              |
| ------------------ | ------------------------------------------------------ |
| `npm run dev`      | Servidor de desenvolvimento (HMR).                     |
| `npm run dev:https`| Dev server com HTTPS experimental (`localhost`).       |
| `npm run build`    | Build de produção.                                     |
| `npm run start`    | Servidor de produção (após o build).                   |
| `npm run lint`     | ESLint.                                                |
| `npm run typecheck`| Checagem de tipos (`tsc --noEmit`).                    |
| `npm run db:*`     | Comandos de banco (ver [Banco de dados](#banco-de-dados)). |

---

## Estrutura do projeto

```
.
├── app/                      # App Router (páginas, layouts e rotas de API)
│   ├── api/                  # Route handlers (backend)
│   │   ├── auth/             # Login/logout/sessão do cliente
│   │   ├── merchant/         # Backend do painel do estabelecimento
│   │   ├── merchants/        # Catálogo público de estabelecimentos
│   │   ├── orders/           # Pedidos do cliente
│   │   ├── recharge/         # Recarga PIX
│   │   ├── wallet/           # Saldo e extrato
│   │   └── webhook/confrapix # Callback de status do PIX
│   ├── establishment/[id]/   # Cardápio e montagem do pedido
│   ├── pedidos/              # Histórico e detalhe do pedido (com QR)
│   ├── painel/               # Portal do estabelecimento
│   ├── login/  welcome/  convite/   # Onboarding/entrada do cliente
│   └── layout.tsx, page.tsx  # Layout raiz e home (carteira)
├── components/               # Componentes de UI (Button, Modal, QrScanner, ...)
├── db/                       # Schema, conexão, queries e seed (Drizzle)
│   ├── schema.ts             # Definição das tabelas e relations
│   ├── wallet.ts             # Carteira, recargas e ledger
│   ├── orders.ts             # Ciclo de vida do pedido (reserva/captura)
│   ├── merchant.ts           # Operações do estabelecimento
│   ├── queries.ts, index.ts  # Consultas compartilhadas e conexão
│   └── seed.ts               # Dados de demonstração
├── lib/                      # Lógica compartilhada (server e client)
│   ├── confrapix.ts          # Client da API PIX (somente servidor)
│   ├── customer-auth.ts      # Auth/sessão do cliente (HMAC)
│   ├── merchant-auth.ts      # Auth/sessão do painel (HMAC)
│   ├── config.ts             # Constantes da demo (evento, TTL de reserva)
│   ├── money.ts              # Helpers de valores em centavos / BRL
│   └── *-client.ts           # Funções de fetch usadas no client
├── public/products/          # Imagens dos produtos
├── docs/                     # Documentação de discovery, specs e arquitetura
└── next.config.ts            # Configuração do Next.js
```

---

## Rotas da aplicação (UI)

| Rota                    | Público        | Descrição                                            |
| ----------------------- | -------------- | ---------------------------------------------------- |
| `/`                     | Cliente        | Home da carteira: saldo, estabelecimentos, recarga.  |
| `/welcome`, `/convite`  | Cliente        | Entrada/onboarding.                                  |
| `/login`                | Cliente        | Login por código de acesso.                          |
| `/establishment/[id]`   | Cliente        | Cardápio do estabelecimento e montagem do pedido.    |
| `/pedidos`              | Cliente        | Lista de pedidos.                                    |
| `/pedidos/[id]`         | Cliente        | Detalhe do pedido + QR Code de retirada.             |
| `/painel/login`         | Estabelecimento| Login do portal.                                     |
| `/painel`               | Estabelecimento| Visão geral do estabelecimento.                      |
| `/painel/produtos`      | Estabelecimento| Gestão do cardápio.                                  |
| `/painel/pedidos`       | Estabelecimento| Pedidos + leitura de QR para captura.                |

---

## Referência da API

Todas sob `app/api/`. Rotas autenticadas usam o cookie de sessão correspondente.

### Cliente
| Método | Endpoint               | Descrição                                  |
| ------ | ---------------------- | ------------------------------------------ |
| POST   | `/api/auth/login`      | Login por código; cria sessão do cliente.  |
| POST   | `/api/auth/logout`     | Encerra a sessão.                          |
| GET    | `/api/auth/session`    | Dados da sessão atual.                      |
| GET    | `/api/wallet`          | Saldo da carteira (disponível/reservado).  |
| GET    | `/api/wallet/history`  | Extrato (lançamentos do ledger).           |
| POST   | `/api/recharge`        | Cria recarga PIX (retorna QR/copia-e-cola).|
| GET    | `/api/recharge/[id]`   | Status de uma recarga.                      |
| GET    | `/api/orders`          | Lista pedidos do cliente.                   |
| POST   | `/api/orders`          | Cria pedido (reserva o valor).              |
| GET    | `/api/orders/[id]`     | Detalhe do pedido.                          |
| DELETE | `/api/orders/[id]`     | Cancela o pedido (libera a reserva).        |

### Catálogo (público)
| Método | Endpoint                  | Descrição                              |
| ------ | ------------------------- | -------------------------------------- |
| GET    | `/api/merchants`          | Lista estabelecimentos do evento.      |
| GET    | `/api/merchants/[slug]`   | Detalhe do estabelecimento + cardápio. |

### Estabelecimento (painel)
| Método | Endpoint                          | Descrição                                   |
| ------ | --------------------------------- | ------------------------------------------- |
| POST   | `/api/merchant/login`             | Login do portal.                            |
| POST   | `/api/merchant/logout`            | Encerra sessão do portal.                   |
| GET    | `/api/merchant/session`           | Sessão atual do portal.                     |
| GET    | `/api/merchant/products`          | Lista produtos do estabelecimento.          |
| POST   | `/api/merchant/products`          | Cria produto.                               |
| PATCH  | `/api/merchant/products/[id]`     | Atualiza produto (ex.: preço, ativo).       |
| DELETE | `/api/merchant/products/[id]`     | Remove produto.                             |
| GET    | `/api/merchant/orders`            | Lista pedidos do estabelecimento.           |
| POST   | `/api/merchant/redeem`            | Valida o QR e **captura** o pedido.         |

### Webhook
| Método | Endpoint                    | Descrição                                              |
| ------ | --------------------------- | ------------------------------------------------------ |
| POST   | `/api/webhook/confrapix`    | Callback de status do PIX. Idempotente; responde 200.  |

---

## Modelo de dados

Tabelas principais (`db/schema.ts`):

- **`events`** — evento (escopo de estabelecimentos e carteiras).
- **`consumers`** — frequentadores.
- **`merchants`** / **`merchant_users`** — estabelecimentos e logins do painel.
- **`products`** — itens do cardápio (`price_cents`, `active`, ...).
- **`wallets`** — carteira por consumidor/evento. `balance_cents` (liquidado) e
  `reserved_cents` (reservado por pedidos pending). **Disponível = balance − reserved.**
- **`top_ups`** — recargas PIX e seu ciclo (`pending → confirmed/failed/expired`),
  com dados de rastreio da Confrapix (`provider_uuid`, `txid`, QR, etc.).
- **`orders`** / **`order_items`** — pedido (com `qr_token` único e snapshot de preço/nome
  por item) e seu ciclo `pending → redeemed/cancelled/expired`.
- **`ledger_entries`** — livro-razão imutável (recarga, débito de compra, crédito do
  lojista, estorno, ajuste). Índice único garante **idempotência**.

---

## Integração PIX (Confrapix)

- O cliente (`lib/confrapix.ts`) fala com a API Confrapix usando **Bearer token**, lido
  **apenas no servidor** a partir de `CONFRAPIX_API_TOKEN` — o token nunca chega ao frontend.
- `POST /api/recharge` cria a cobrança PIX e devolve o QR Code e o código copia-e-cola; o
  registro vira uma linha em `top_ups` com status `pending`.
- Quando o pagamento é confirmado, a Confrapix chama o webhook
  `POST /api/webhook/confrapix`. O handler localiza a recarga, credita a carteira
  (`top_up` no ledger) e marca `confirmed`. É **idempotente**: o índice único do ledger
  impede crédito duplicado em reentregas, e o endpoint sempre responde `200`.

---

## Credenciais da demo

Definidas por variáveis de ambiente (com padrões em código para a demo):

- **Cliente:** código de acesso `CUSTOMER_ACCESS_CODE` (padrão `1234`) em `/login`.
- **Estabelecimento:** `MERCHANT_PORTAL_EMAIL` / `MERCHANT_PORTAL_PASSWORD` em
  `/painel/login`, com `MERCHANT_PORTAL_SLUG` casando um estabelecimento semeado
  (ex.: `palco-sunset`).

> As sessões exigem `CUSTOMER_SESSION_SECRET` / `MERCHANT_SESSION_SECRET` fortes; sem eles
> o login falha por design (fail-closed).

---

## Notas de build e deploy

- `next.config.ts` está configurado com `typescript.ignoreBuildErrors: true` — o build de
  produção conclui mesmo com erros de TypeScript. **Recomendado** rodar `npm run typecheck`
  no CI e remover essa flag quando os tipos estiverem limpos.
- `images.remotePatterns` permite imagens de `placehold.co` e `picsum.photos`.
- `allowedDevOrigins` libera o acesso ao dev server por IP na mesma rede (ajuste o IP em
  `next.config.ts` conforme sua rede para testar no celular).

---

Para contexto de produto e decisões de arquitetura, consulte `docs/` (discovery, specs e
ADRs).
