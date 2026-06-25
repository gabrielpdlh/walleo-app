# Modelagem Inicial do Dominio

## Objetivo

Definir uma modelagem inicial do dominio para sustentar:

- as telas iniciais do MVP;
- os endpoints P0;
- o handoff para backend;
- a demonstracao com recarga PIX e movimentacao de ledger.

## Escopo desta modelagem

Esta modelagem cobre apenas o recorte inicial do produto:

- frequentador;
- carteira;
- recarga via PIX;
- estabelecimentos;
- cobranca;
- pagamento;
- extrato e ledger.

Nao cobre nesta fase:

- painel do organizador;
- repasse financeiro real;
- conciliacao completa;
- operacao offline do PDV;
- multi-tenant detalhado.

## Principios do modelo

1. O saldo da carteira deve ser coerente com o ledger.
2. Recarga e consumo sao eventos de dominio, nao apenas campos alterados.
3. O estabelecimento recebe credito logico, nao liquidacao financeira imediata.
4. IDs devem ser opacos e independentes de dados pessoais.
5. CPF pode ser chave de identificacao operacional, mas nao deve ser a unica barreira de acesso.

## Entidades principais

## 1. Event

Representa o evento no qual a carteira e usada.

### Campos iniciais

- `id`
- `name`
- `status`
- `startAt`
- `endAt`
- `location`

### Status sugeridos

- `draft`
- `active`
- `closed`

## 2. Consumer

Representa o frequentador dono da carteira.

### Campos iniciais

- `id`
- `fullName`
- `cpf`
- `email`
- `phone`
- `accessMode`
- `status`

### Access modes sugeridos

- `magic_link`
- `assisted`
- `physical_credential`

### Status sugeridos

- `pending_access`
- `active`
- `blocked`

## 3. Wallet

Representa a carteira do frequentador dentro do evento.

### Campos iniciais

- `id`
- `eventId`
- `consumerId`
- `status`
- `currency`
- `balanceCents`
- `createdAt`
- `activatedAt`

### Status sugeridos

- `created`
- `active`
- `blocked`
- `closed`

### Observacao

Mesmo que o sistema mantenha `balanceCents` materializado para leitura rapida, a fonte conceitual do saldo deve ser o ledger.

## 4. Merchant

Representa o estabelecimento participante do evento.

### Campos iniciais

- `id`
- `eventId`
- `name`
- `category`
- `status`

### Status sugeridos

- `active`
- `inactive`

## 5. TopUp

Representa a recarga via PIX feita para a carteira.

### Campos iniciais

- `id`
- `walletId`
- `eventId`
- `amountCents`
- `status`
- `provider`
- `providerReference`
- `txid`
- `pixQrCode`
- `pixCopyPasteCode`
- `expiresAt`
- `createdAt`
- `confirmedAt`
- `failedAt`

### Status sugeridos

- `created`
- `pending`
- `processing`
- `confirmed`
- `failed`
- `expired`

### Observacao

`TopUp` representa o fluxo de entrada de saldo, e nao apenas a cobranca PIX.

## 6. Charge

Representa a cobranca aberta por um estabelecimento para um frequentador.

### Campos iniciais

- `id`
- `eventId`
- `merchantId`
- `walletId`
- `amountCents`
- `description`
- `status`
- `createdAt`
- `expiresAt`
- `confirmedAt`
- `cancelledAt`

### Status sugeridos

- `created`
- `pending`
- `confirmed`
- `cancelled`
- `expired`

## 7. LedgerEntry

Representa uma linha imutavel do livro-razao da operacao.

### Campos iniciais

- `id`
- `eventId`
- `walletId`
- `merchantId`
- `entryType`
- `direction`
- `amountCents`
- `referenceType`
- `referenceId`
- `balanceAfterCents`
- `createdAt`

### Entry types sugeridos

- `top_up`
- `purchase_debit`
- `merchant_credit`
- `adjustment`

### Direction sugerida

- `credit`
- `debit`

### Observacao

Para o frequentador, toda compra gera um `purchase_debit`.

Para o estabelecimento, a mesma compra gera um `merchant_credit`.

## 8. TransactionReceipt

Representa a visao de comprovante usada pelo frontend.

### Campos iniciais

- `id`
- `chargeId`
- `walletId`
- `merchantId`
- `amountCents`
- `status`
- `confirmedAt`
- `summary`

## 9. AccessSession

Representa a sessao do frequentador no frontend.

### Campos iniciais

- `id`
- `consumerId`
- `walletId`
- `eventId`
- `accessToken`
- `expiresAt`
- `createdAt`

## Relacoes principais

- Um `Event` possui muitos `Merchant`
- Um `Event` possui muitas `Wallet`
- Um `Consumer` possui uma ou mais `Wallet` ao longo do tempo
- Uma `Wallet` pertence a um `Consumer` e a um `Event`
- Uma `Wallet` possui muitos `TopUp`
- Uma `Wallet` possui muitas `Charge`
- Uma `Wallet` possui muitas `LedgerEntry`
- Um `Merchant` cria muitas `Charge`
- Uma `Charge` gera entradas de ledger
- Um `TopUp` gera ao menos uma entrada de ledger quando confirmado

## Regras de negocio iniciais

## Regra 1. Saldo nao pode ficar negativo

Antes de confirmar uma `Charge`, o sistema deve validar saldo suficiente.

## Regra 2. Recarga confirmada gera credito

Quando um `TopUp` muda para `confirmed`, deve ser criada entrada positiva no ledger da carteira.

## Regra 3. Compra confirmada gera dois efeitos logicos

Quando uma `Charge` muda para `confirmed`:

- a carteira do frequentador recebe um debito;
- o estabelecimento recebe um credito logico.

## Regra 4. Historico deve refletir o ledger

O extrato do usuario deve ser derivado do ledger ou de uma projection coerente com ele.

## Regra 5. Cobranca nao pode ser confirmada duas vezes

`Charge` precisa de protecao contra dupla confirmacao.

## Regra 6. Recarga precisa ter rastreabilidade com PIX

Cada `TopUp` deve manter referencia suficiente para correlacao com a integracao PIX.

## Agregados sugeridos

## Aggregate 1. Wallet

Raiz de agregacao principal para:

- saldo;
- recargas;
- cobrancas do frequentador;
- ledger do frequentador.

## Aggregate 2. Charge

Raiz de agregacao para:

- status da cobranca;
- expiracao;
- confirmacao ou cancelamento.

## Aggregate 3. TopUp

Raiz de agregacao para:

- criacao da cobranca PIX;
- acompanhamento da recarga;
- confirmacao da entrada de saldo.

## Enumeracoes iniciais sugeridas

## WalletStatus

- `created`
- `active`
- `blocked`
- `closed`

## TopUpStatus

- `created`
- `pending`
- `processing`
- `confirmed`
- `failed`
- `expired`

## ChargeStatus

- `created`
- `pending`
- `confirmed`
- `cancelled`
- `expired`

## AccessMode

- `magic_link`
- `assisted`
- `physical_credential`

## EntryType

- `top_up`
- `purchase_debit`
- `merchant_credit`
- `adjustment`

## Fluxos mapeados ao modelo

## Fluxo A. Entrada na carteira

- `Consumer`
- `AccessSession`
- `Wallet`
- `Event`

## Fluxo B. Recarga via PIX

- `Wallet`
- `TopUp`
- `LedgerEntry`

## Fluxo C. Cobranca do estabelecimento

- `Merchant`
- `Charge`

## Fluxo D. Confirmacao de pagamento

- `Charge`
- `Wallet`
- `LedgerEntry`
- `TransactionReceipt`

## Fluxo E. Extrato

- `Wallet`
- `LedgerEntry`

## Ponto de atencao para a proxima fase

Antes de backend e frontend avançarem juntos, esta modelagem ainda precisa ser refinada em:

1. schemas JSON por entidade
2. matriz de estados e transicoes
3. regras de idempotencia
4. diferenca entre saldo materializado e saldo calculado
5. regras de fallback para acesso assistido

## Recomendacao

Usar esta modelagem como base inicial de conversa entre frontend, backend e produto, sem tratar estes nomes e campos como definitivos ate o alinhamento do time.
