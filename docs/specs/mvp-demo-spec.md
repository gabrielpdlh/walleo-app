# Especificacao Normativa do MVP de Demonstracao

## 1. Objetivo

Esta especificacao define, de forma normativa, o comportamento minimo obrigatorio do MVP de demonstracao para a apresentacao da solucao a Confrapag.

Este documento substitui ambiguidade por regras objetivas de escopo, comportamento, integracao e aceite.

## 2. Escopo oficial

O MVP de demonstracao MUST provar os seguintes comportamentos:

1. o frequentador acessa sua carteira do evento;
2. o frequentador realiza recarga via PIX;
3. o sistema confirma a entrada de saldo na carteira;
4. o estabelecimento inicia uma cobranca;
5. o frequentador confirma o pagamento;
6. o sistema debita o ledger do frequentador;
7. o sistema credita logicamente o estabelecimento;
8. o frequentador consulta o historico da operacao.

## 3. Fora de escopo

Os seguintes itens MUST NOT ser considerados obrigatorios para esta entrega:

- painel do organizador;
- dashboard administrativo;
- repasse financeiro real a estabelecimento;
- conciliacao completa;
- operacao offline do PDV;
- multi-tenant completo;
- importacao automatica via webhook de ticketing como prerequisito da demo.

## 4. Stakeholders e atores

## 4.1. Frequentador

Ator principal da jornada.

## 4.2. Estabelecimento

Ator operacional que inicia a cobranca.

## 4.3. Backend

Servico responsavel por autenticacao, integracao PIX, ledger e estados transacionais.

## 5. Requisitos funcionais normativos

## RF-DEM-01. Acesso

O sistema MUST permitir que o frequentador acesse sua carteira via magic link.

## RF-DEM-02. Carteira

O sistema MUST exibir:

- nome do evento;
- saldo atual;
- acesso a recarga;
- acesso ao historico;
- acesso a estabelecimentos.

## RF-DEM-03. Recarga PIX

O sistema MUST permitir a criacao de recarga via PIX.

Essa recarga MUST retornar, quando suportado pela integracao:

- QR code;
- codigo copia e cola;
- identificador da cobranca;
- expiracao;
- status inicial.

## RF-DEM-04. Acompanhamento da recarga

O sistema MUST permitir acompanhar o status da recarga ate um desfecho terminal.

## RF-DEM-05. Confirmacao de recarga

Quando a recarga for confirmada, o sistema MUST:

- atualizar o saldo da carteira;
- registrar uma entrada positiva no ledger do frequentador;
- refletir a recarga no historico.

## RF-DEM-06. Listagem de estabelecimentos

O sistema MUST listar os estabelecimentos disponiveis no evento.

## RF-DEM-07. Criacao de cobranca

O sistema MUST permitir que o estabelecimento crie uma cobranca associada a uma carteira.

## RF-DEM-08. Cobranca pendente

O sistema MUST apresentar ao frequentador a cobranca pendente com:

- nome do estabelecimento;
- valor;
- descricao opcional;
- saldo antes da confirmacao.

## RF-DEM-09. Confirmacao de pagamento

Quando o frequentador confirmar a cobranca, o sistema MUST:

- validar saldo suficiente;
- impedir confirmacao duplicada;
- debitar o ledger do frequentador;
- creditar logicamente o estabelecimento;
- retornar comprovante da operacao.

## RF-DEM-10. Historico

O sistema MUST exibir historico de:

- recargas;
- compras;
- data e hora;
- valor;
- referencia do estabelecimento quando aplicavel.

## 6. Requisitos nao funcionais normativos

## RNF-DEM-01. Integracao PIX

A recarga via PIX MUST ser real ou homologada com a integracao da Confrapag.

A recarga MUST NOT ser apenas um mock visual.

## RNF-DEM-02. Token protegido

O token de integracao com a Confrapag MUST permanecer no backend.

O frontend MUST NOT expor credenciais sensiveis.

## RNF-DEM-03. Rastreabilidade

Recargas e pagamentos MUST possuir identificadores de referencia rastreaveis.

## RNF-DEM-04. Consistencia do saldo

O saldo exibido ao usuario MUST ser coerente com o ledger ou com projection derivada dele.

## RNF-DEM-05. Linguagem

A experiencia do MVP MUST ser apresentada em Portugues Brasil.

## 7. Modelo de dominio normativo

As entidades minimas obrigatorias sao:

- `Event`
- `Consumer`
- `Wallet`
- `Merchant`
- `TopUp`
- `Charge`
- `LedgerEntry`
- `TransactionReceipt`
- `AccessSession`

## 7.1. Regras do ledger

O modelo de ledger MUST obedecer as seguintes regras:

1. saldo do frequentador MUST NOT ficar negativo;
2. toda recarga confirmada MUST gerar credito no ledger do frequentador;
3. toda compra confirmada MUST gerar debito no ledger do frequentador;
4. toda compra confirmada MUST gerar credito logico para o estabelecimento;
5. o historico MUST refletir o ledger ou projection consistente com ele.

## 8. Estados normativos

## 8.1. TopUpStatus

Estados permitidos:

- `created`
- `pending`
- `processing`
- `confirmed`
- `failed`
- `expired`

Estado terminal:

- `confirmed`
- `failed`
- `expired`

## 8.2. ChargeStatus

Estados permitidos:

- `created`
- `pending`
- `confirmed`
- `cancelled`
- `expired`

Estado terminal:

- `confirmed`
- `cancelled`
- `expired`

## 8.3. WalletStatus

Estados permitidos:

- `created`
- `active`
- `blocked`
- `closed`

## 9. Fluxos normativos

## 9.1. Fluxo A. Acesso

1. usuario solicita acesso;
2. backend envia magic link;
3. usuario valida magic link;
4. backend retorna sessao e contexto da carteira.

## 9.2. Fluxo B. Recarga PIX

1. usuario seleciona valor;
2. frontend solicita criacao da recarga;
3. backend cria cobranca PIX;
4. frontend exibe QR code e/ou copia e cola;
5. frontend consulta ou atualiza status;
6. backend confirma recarga;
7. saldo e historico sao atualizados.

## 9.3. Fluxo C. Cobranca do estabelecimento

1. estabelecimento informa valor;
2. backend cria cobranca;
3. frontend do frequentador exibe cobranca pendente.

## 9.4. Fluxo D. Pagamento

1. frequentador revisa cobranca;
2. frequendator confirma;
3. backend valida saldo;
4. backend grava debito e credito logico;
5. backend retorna comprovante;
6. frontend exibe sucesso e novo saldo.

## 10. Endpoints minimos obrigatorios

Os seguintes endpoints sao MUST para a demo:

1. `POST /api/v1/auth/magic-link/request`
2. `POST /api/v1/auth/magic-link/verify`
3. `GET /api/v1/wallets/me`
4. `GET /api/v1/events/:eventId`
5. `GET /api/v1/events/:eventId/merchants`
6. `POST /api/v1/wallets/me/top-ups`
7. `GET /api/v1/wallets/me/top-ups/:topUpId`
8. `POST /api/v1/wallets/me/top-ups/:topUpId/refresh`
9. `POST /api/v1/merchant-charges`
10. `GET /api/v1/wallets/me/charges/pending`
11. `GET /api/v1/charges/:chargeId`
12. `POST /api/v1/charges/:chargeId/confirm`
13. `GET /api/v1/wallets/me/history`
14. `GET /api/v1/receipts/:transactionId`

## 11. Erros obrigatorios

O sistema MUST modelar e expor, no minimo, estes erros:

- recarga expirada;
- recarga nao paga;
- falha na integracao PIX;
- saldo insuficiente;
- cobranca expirada;
- cobranca cancelada;
- cobranca ja confirmada;
- usuario nao autenticado;
- recurso nao encontrado.

## 12. Telas minimas obrigatorias

As telas minimas obrigatorias do MVP sao:

1. entrada e acesso;
2. carteira do evento;
3. recarga via PIX;
4. acompanhamento da recarga;
5. estabelecimentos;
6. cobranca pendente e revisao;
7. sucesso e comprovante;
8. extrato e historico;
9. interface simplificada do estabelecimento;
10. status da cobranca do estabelecimento.

## 13. Criterios de aceite da demonstracao

O MVP sera considerado aderente a esta especificacao somente se:

1. a recarga via PIX funcionar de forma demonstravel;
2. a carteira refletir o saldo apos confirmacao da recarga;
3. o estabelecimento conseguir iniciar cobranca;
4. o frequentador conseguir confirmar pagamento;
5. o saldo do frequentador diminuir apos a compra;
6. o sistema registrar credito logico ao estabelecimento;
7. o extrato mostrar recarga e compra;
8. o token da integracao permanecer protegido no backend.

## 14. Nao conformidades criticas

Caracterizam nao conformidade critica:

- recarga sem integracao PIX;
- saldo alterado apenas localmente no frontend;
- pagamento confirmado sem validacao de saldo;
- ausencia de historico coerente com a operacao;
- uso de token sensivel no frontend.

## 15. Artefatos complementares

Esta especificacao deve ser lida em conjunto com:

- [mvp-demo-brief.md](../discovery/mvp-demo-brief.md)
- [mvp-demo-plan.md](../discovery/mvp-demo-plan.md)
- [initial-screens.md](../discovery/initial-screens.md)
- [required-endpoints.md](../discovery/required-endpoints.md)
- [initial-domain-model.md](../discovery/initial-domain-model.md)
- [backend-handoff-initial-needs.md](../discovery/backend-handoff-initial-needs.md)
