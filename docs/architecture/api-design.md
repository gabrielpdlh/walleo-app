# Design da API (Full-stack Next.js)

## Objetivo

Este documento descreve o design da API para o projeto Walleo-Events. Como estamos usando uma arquitetura Next.js full-stack, estes endpoints serão implementados como API Routes dentro de `app/api/`.

Este documento serve como a fonte da verdade para a implementação do backend.

## Endpoints da API

### Convenções

- prefixo base: `/api/v1`
- respostas JSON
- ids opacos como `evt_`, `wal_`, `chg_`, `top_`, `txn_`
- valores monetarios em centavos inteiros
- timestamps em ISO 8601

## Visao resumida dos endpoints

1. `POST /api/v1/auth/magic-link/request`
2. `POST /api/v1/auth/magic-link/verify`
3. `GET /api/v1/events/:eventId`
4. `GET /api/v1/wallets/me`
5. `GET /api/v1/events/:eventId/merchants`
6. `GET /api/v1/wallets/me/history`
7. `POST /api/v1/wallets/me/top-ups`
8. `GET /api/v1/wallets/me/top-ups/:topUpId`
9. `POST /api/v1/wallets/me/top-ups/:topUpId/refresh`
10. `POST /api/v1/merchant-charges`
11. `GET /api/v1/wallets/me/charges/pending`
12. `GET /api/v1/charges/:chargeId`
13. `POST /api/v1/charges/:chargeId/confirm`
14. `POST /api/v1/charges/:chargeId/cancel`
15. `GET /api/v1/receipts/:transactionId`
16. `GET /api/v1/support/wallet-lookup`

## Endpoints por tela

## 1. Tela de entrada e acesso

### Endpoint 1. Solicitar magic link

`POST /api/v1/auth/magic-link/request`

### Objetivo

Solicitar envio de magic link para o e-mail associado ao ingresso ou conta.

### Request

```json
{
  "email": "cliente@exemplo.com",
  "eventId": "evt_123"
}
```

### Response

```json
{
  "requestId": "mlr_123",
  "status": "sent"
}
```

### Erros importantes

- `404` usuario ou evento nao encontrado
- `409` carteira ainda nao provisionada
- `429` muitas tentativas

### Endpoint 2. Validar magic link

`POST /api/v1/auth/magic-link/verify`

### Objetivo

Trocar token do magic link por sessao autenticada.

### Request

```json
{
  "token": "magic_link_token"
}
```

### Response

```json
{
  "session": {
    "accessToken": "jwt-ou-token-de-sessao",
    "expiresAt": "2026-06-09T21:00:00Z"
  },
  "consumer": {
    "id": "con_123",
    "name": "Maria"
  },
  "walletId": "wal_123",
  "eventId": "evt_123"
}
```

## 2. Tela da carteira do evento

### Endpoint 3. Obter evento

`GET /api/v1/events/:eventId`

### Objetivo

Retornar dados do evento usados na carteira.

### Response

```json
{
  "id": "evt_123",
  "name": "Festival TAP",
  "status": "active"
}
```

### Endpoint 4. Obter carteira do frequentador

`GET /api/v1/wallets/me`

### Objetivo

Retornar saldo, status da carteira e dados resumidos do usuario.

### Response

```json
{
  "wallet": {
    "id": "wal_123",
    "balanceCents": 15000,
    "currency": "BRL",
    "status": "active"
  },
  "consumer": {
    "id": "con_123",
    "name": "Maria"
  }
}
```

## 3. Tela de recarga via PIX

### Endpoint 5. Criar recarga PIX

`POST /api/v1/wallets/me/top-ups`

### Objetivo

Criar cobranca PIX para entrada de saldo na carteira.

### Request

```json
{
  "amountCents": 5000,
  "eventId": "evt_123"
}
```

### Response

```json
{
  "topUp": {
    "id": "top_123",
    "status": "pending",
    "amountCents": 5000,
    "expiresAt": "2026-06-09T21:10:00Z",
    "txid": "pix_tx_123"
  },
  "pix": {
    "qrCode": "base64-ou-payload",
    "copyPasteCode": "000201..."
  }
}
```

### Erros importantes

- `400` valor invalido
- `401` nao autenticado
- `409` recarga em conflito
- `502` falha na integracao PIX

## 4. Tela de acompanhamento da recarga

### Endpoint 6. Consultar recarga

`GET /api/v1/wallets/me/top-ups/:topUpId`

### Objetivo

Consultar status atual da recarga PIX.

### Response

```json
{
  "topUp": {
    "id": "top_123",
    "status": "processing",
    "amountCents": 5000,
    "txid": "pix_tx_123",
    "expiresAt": "2026-06-09T21:10:00Z",
    "confirmedAt": null
  }
}
```

### Endpoint 7. Atualizar estado da recarga

`POST /api/v1/wallets/me/top-ups/:topUpId/refresh`

### Objetivo

Forcar nova checagem de status da recarga quando necessario.

### Request

```json
{}
```

### Response

Mesmo shape do endpoint de consulta.

## 5. Tela de estabelecimentos

### Endpoint 8. Listar estabelecimentos do evento

`GET /api/v1/events/:eventId/merchants`

### Objetivo

Retornar estabelecimentos disponiveis.

### Response

```json
{
  "items": [
    {
      "id": "mer_123",
      "name": "Bar Central",
      "category": "Bebidas"
    }
  ]
}
```

## 6. Tela de cobranca pendente e revisao de pagamento

### Endpoint 9. Criar cobranca do estabelecimento

`POST /api/v1/merchant-charges`

### Objetivo

Permitir que a interface simplificada do estabelecimento abra uma cobranca para o frequentador.

### Request

```json
{
  "merchantId": "mer_123",
  "walletId": "wal_123",
  "amountCents": 3000,
  "description": "2 refrigerantes"
}
```

### Response

```json
{
  "charge": {
    "id": "chg_123",
    "status": "pending",
    "merchantId": "mer_123",
    "walletId": "wal_123",
    "amountCents": 3000,
    "description": "2 refrigerantes",
    "createdAt": "2026-06-09T20:00:00Z"
  }
}
```

### Endpoint 10. Obter cobranca pendente do frequentador

`GET /api/v1/wallets/me/charges/pending`

### Objetivo

Retornar a cobranca pendente para exibicao na tela do frequentador.

### Response

```json
{
  "charge": {
    "id": "chg_123",
    "status": "pending",
    "merchant": {
      "id": "mer_123",
      "name": "Bar Central"
    },
    "amountCents": 3000,
    "description": "2 refrigerantes"
  }
}
```

### Endpoint 11. Obter cobranca por id

`GET /api/v1/charges/:chargeId`

### Objetivo

Retornar detalhes completos da cobranca para revisao ou status.

## 7. Tela de sucesso e comprovante

### Endpoint 12. Confirmar pagamento

`POST /api/v1/charges/:chargeId/confirm`

### Objetivo

Debitar a carteira do frequentador e creditar logicamente o estabelecimento.

### Request

```json
{
  "walletId": "wal_123"
}
```

### Response

```json
{
  "transaction": {
    "id": "txn_123",
    "chargeId": "chg_123",
    "status": "confirmed",
    "debitedAmountCents": 3000,
    "balanceAfterCents": 12000,
    "confirmedAt": "2026-06-09T20:05:00Z"
  },
  "merchantCredit": {
    "merchantId": "mer_123",
    "creditedAmountCents": 3000
  }
}
```

### Erros importantes

- `409` saldo insuficiente
- `409` cobranca ja paga
- `410` cobranca expirada

### Endpoint 13. Consultar comprovante

`GET /api/v1/receipts/:transactionId`

### Objetivo

Retornar dados usados na tela de sucesso ou compartilhamento futuro.

## 8. Tela de extrato e historico

### Endpoint 14. Listar historico da carteira

`GET /api/v1/wallets/me/history`

### Objetivo

Retornar recargas e consumos em ordem temporal.

### Query params sugeridos

- `cursor`
- `limit`
- `type=top_up|purchase|all`

### Response

```json
{
  "items": [
    {
      "id": "led_123",
      "type": "top_up",
      "amountCents": 5000,
      "createdAt": "2026-06-09T19:55:00Z"
    },
    {
      "id": "led_124",
      "type": "purchase",
      "amountCents": -3000,
      "merchantName": "Bar Central",
      "createdAt": "2026-06-09T20:05:00Z"
    }
  ]
}
```

## 9. Tela simplificada do estabelecimento para iniciar cobranca

Usa principalmente:

- `GET /api/v1/events/:eventId/merchants`
- `POST /api/v1/merchant-charges`
- `GET /api/v1/charges/:chargeId`

## 10. Tela de status da cobranca do estabelecimento

### Endpoint 15. Cancelar cobranca

`POST /api/v1/charges/:chargeId/cancel`

### Objetivo

Permitir cancelamento da cobranca antes da confirmacao.

### Request

```json
{}
```

### Response

```json
{
  "charge": {
    "id": "chg_123",
    "status": "cancelled"
  }
}
```

## 11. Tela de acesso assistido ou fallback operacional

### Endpoint 16. Buscar carteira por dado assistido

`GET /api/v1/support/wallet-lookup`

### Query params sugeridos

- `cpf`
- `ticketCode`

### Objetivo

Permitir localizacao assistida de carteira em casos de excecao.

### Observacao

Este endpoint nao precisa entrar na primeira entrega da demo, mas deve ser previsto para o MVP real.

## Matriz tela x endpoint

| Tela | Endpoints principais |
| --- | --- |
| Entrada e acesso | `POST /auth/magic-link/request`, `POST /auth/magic-link/verify` |
| Carteira | `GET /events/:eventId`, `GET /wallets/me` |
| Recarga PIX | `POST /wallets/me/top-ups` |
| Acompanhamento da recarga | `GET /wallets/me/top-ups/:topUpId`, `POST /wallets/me/top-ups/:topUpId/refresh` |
| Estabelecimentos | `GET /events/:eventId/merchants` |
| Cobranca pendente | `GET /wallets/me/charges/pending`, `GET /charges/:chargeId` |
| Sucesso/comprovante | `POST /charges/:chargeId/confirm`, `GET /receipts/:transactionId` |
| Historico | `GET /wallets/me/history` |
| Estabelecimento simplificado | `POST /merchant-charges`, `GET /charges/:chargeId` |
| Status da cobranca | `GET /charges/:chargeId`, `POST /charges/:chargeId/cancel` |
| Fallback operacional | `GET /support/wallet-lookup` |

## Endpoints P0 para a demo

Se precisarmos reduzir ao minimo indispensavel, os endpoints P0 sao:

1. `POST /api/v1/auth/magic-link/request`
2. `POST /api/v1/auth/magic-link/verify`
3. `GET /api/v1/wallets/me`
4. `POST /api/v1/wallets/me/top-ups`
5. `GET /api/v1/wallets/me/top-ups/:topUpId`
6. `GET /api/v1/events/:eventId/merchants`
7. `POST /api/v1/merchant-charges`
8. `GET /api/v1/wallets/me/charges/pending`
9. `POST /api/v1/charges/:chargeId/confirm`
10. `GET /api/v1/wallets/me/history`

## Modelo de Domínio e Regras de Negócio

Esta seção detalha as entidades e regras de negócio que a API deve seguir.

### Modelo de Domínio

As entidades centrais da aplicação são:

- `event`
- `consumer`
- `consumerWallet`
- `merchant`
- `charge`
- `ledgerEntry`
- `transactionHistoryItem`

Para cada entidade, devemos definir:
- Nomes e identificadores
- Relações entre entidades
- Status válidos
- Campos obrigatórios vs. opcionais

### Regras de Negócio do Ledger

A lógica do ledger é o coração do sistema e deve seguir estas regras:

- O saldo do frequentador é derivado do ledger ou de um saldo materializado.
- Toda recarga gera uma entrada positiva no ledger do frequentador.
- Todo pagamento gera uma saída no ledger do frequentador.
- Todo pagamento gera um crédito lógico para o estabelecimento.
- O saldo não pode ficar negativo.
- Toda transação precisa ter rastreabilidade e timestamp.

**Questões de implementação a serem definidas:**
- Como identificar a idempotência de cobranças e pagamentos?
- Quais status de cobrança e transação existem?
- Como representar cancelamento, expiração e falha?

### Modelagem de Estados e Erros

A API deve modelar os seguintes cenários de erro desde o início:

- Saldo insuficiente
- Cobrança expirada
- Cobrança cancelada
- Cobrança já paga
- Falha de processamento
- Recurso não encontrado
- Usuário não autorizado
