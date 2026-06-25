# Necessidades Iniciais para o Time de Backend

## Objetivo

Documentar o que o frontend precisa do backend nesta fase, com foco primeiro no MVP de apresentacao e, em seguida, na transicao para o produto real.

## Resumo executivo

Neste momento, o frontend nao precisa que o backend entregue a plataforma completa.

O que precisamos inicialmente e:

1. alinhamento de modelo de dominio
2. contratos de API esperados
3. regras de negocio minimas do ledger
4. definicao de autenticacao futura
5. limites claros entre demo mockada e integracao real
6. integracao PIX para o fluxo de recarga

## Estrategia recomendada

Separar o handoff em dois niveis:

### P0. Necessario agora

Itens para manter a demo coerente e preparar integracao futura.

### P1. Necessario na fase seguinte

Itens para iniciar backend real do produto apos a apresentacao.

## P0. Necessario agora

## Prioridade numero 1 para esta apresentacao

Como a demo sera apresentada para uma empresa de pagamentos, o backend precisa tratar o fluxo de recarga como a parte mais importante da fase inicial.

Esse trecho nao e mais opcional. O backend precisa entregar:

- criacao da recarga
- processamento da recarga
- confirmacao da entrada de saldo
- reflexo da recarga no ledger e no historico
- integracao PIX correspondente

## 1. Modelo de dominio compartilhado

Precisamos validar com backend as entidades centrais da demo:

- `event`
- `consumer`
- `consumerWallet`
- `merchant`
- `charge`
- `ledgerEntry`
- `transactionHistoryItem`

### O que alinhar

- nomes e identificadores
- relacoes entre entidades
- status validos
- campos obrigatorios versus opcionais

## 2. Regras minimas do ledger

Mesmo em mock, a demo precisa refletir regras reais.

### O backend deve confirmar

- saldo do frequentador e derivado de ledger ou de saldo materializado
- toda recarga gera entrada positiva no ledger do frequentador
- todo pagamento gera saida no ledger do frequentador
- todo pagamento gera credito logico para o estabelecimento
- saldo nao pode ficar negativo
- toda transacao precisa ter rastreabilidade e timestamp

### Perguntas que o backend precisa responder cedo

- qual sera a unidade monetaria persistida: centavos inteiros ou decimal
- como identificar idempotencia de cobranca e pagamento
- quais status de cobranca e transacao existem
- como representar cancelamento, expiracao e falha

## 3. Contratos esperados para a demo

Mesmo que o frontend use mock, precisamos documentar o contrato esperado.

### Contratos minimos

1. obter evento atual
2. obter carteira do frequentador
3. listar estabelecimentos
4. criar recarga PIX
5. consultar ou confirmar recarga PIX
6. criar cobranca
7. obter cobranca pendente
8. confirmar pagamento
9. listar historico

### Para cada contrato, precisamos de

- metodo HTTP esperado
- payload de request
- payload de response
- estados de erro
- campos obrigatorios
- codigos de status

### Recarga merece detalhamento adicional

Para o fluxo de recarga, precisamos especificamente de:

- identificador da recarga
- valor solicitado
- status da recarga
- referencia externa, se houver
- payload PIX retornado pela integracao
- timestamp de criacao
- timestamp de confirmacao
- ledger entry gerada
- historico gerado

### Dados PIX esperados, quando disponiveis

- `qrCode`
- `copyPasteCode`
- `txid` ou referencia equivalente
- expiracao da cobranca
- identificador externo da transacao

### Estados minimos da recarga

- `created`
- `pending`
- `processing`
- `confirmed`
- `failed`
- `expired`

## 4. Politica de autenticacao futura

Para a demo, podemos operar sem autenticacao real robusta. Mas o backend precisa alinhar desde ja:

- como sera o acesso do frequentador
- se o login real sera por magic link
- como a sessao sera representada
- como o app do estabelecimento se autenticara no futuro

### O minimo que precisamos documentado

- shape esperado da sessao do frequentador
- identificador principal do usuario
- duracao esperada da sessao
- politica de refresh, se existir

## 5. Estados e erros que precisam existir desde o contrato

O frontend precisa modelar estes cenarios desde o inicio:

- saldo insuficiente
- cobranca expirada
- cobranca cancelada
- cobranca ja paga
- falha de processamento
- recurso nao encontrado
- usuario nao autorizado

## 6. Observabilidade minima esperada

Mesmo na fase inicial, e importante alinhar:

- `correlationId` nas respostas, quando possivel
- `transactionId` para recargas e pagamentos
- status claros para reconciliar historico do frontend

## P1. Necessario na fase seguinte

## 7. Contratos do produto real

Depois da demo, o backend deve priorizar:

- autenticacao real do frequentador
- recarga real via PIX
- fluxo real de cobranca
- persistencia de ledger
- consulta de historico
- politica de expiracao de cobranca

## 8. Superficies futuras

Nao precisamos disso agora para a demo, mas devemos registrar para o backlog do backend:

- painel do organizador
- operadores de estabelecimento
- dashboards e transacoes administrativas
- repasses
- conciliacao
- webhooks

## Checklist de alinhamento inicial com backend

Antes de qualquer implementacao integrada, o time de backend deveria nos devolver:

1. glossario das entidades principais
2. estados validos de `charge`
3. estados validos de `ledgerEntry`
4. regra oficial do calculo de saldo
5. contratos iniciais das APIs da demo
6. estrategia futura de autenticacao
7. exemplos de payload de sucesso e erro

## Entregavel recomendado do backend para comecar

Se eu fosse reduzir ao minimo indispensavel, pediria ao backend apenas estes quatro artefatos agora:

1. documento curto de dominio do ledger
2. contrato JSON das entidades da demo
3. rascunho dos endpoints principais
4. definicao dos erros e status do fluxo de cobranca e pagamento

Como a recarga e critica para esta apresentacao, eu adicionaria um quinto item:

5. especificacao detalhada do fluxo de recarga com seus estados e retorno esperado
6. definicao do contrato da integracao PIX usada na recarga

## O que nao precisamos cobrar do backend agora

Para evitar dispersao, eu nao cobraria neste momento:

- painel do organizador
- fluxo de repasse
- operacao offline do PDV
- telemetria completa
- estrategia final de multi-tenant

## Recomendacao final

O melhor pedido inicial para o backend e:

"Nos entreguem primeiro o modelo de dominio, as regras do ledger e os contratos do fluxo recarga PIX -> cobranca -> pagamento -> historico, com a recarga PIX implementada como requisito P0."

Esse e o menor conjunto que protege o frontend de retrabalho e mantem a demo coerente com o produto real.
