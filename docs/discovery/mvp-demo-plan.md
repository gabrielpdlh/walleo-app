# Plano do MVP de Apresentacao

## Objetivo

Planejar a execucao de uma demo funcional enxuta, centrada no frequentador e na dinamica de cobranca do estabelecimento.

## Estrategia recomendada

Em vez de construir o produto inteiro, construir uma demonstracao narrativa com consistencia funcional.

### Principio

Tudo o que aparecer na demo precisa:

- parecer plausivel para o usuario final;
- respeitar a logica do produto;
- nao simular algo que contradiga o modelo de negocio.

## Estrutura da demo

### Superficie 1. App do frequentador

Responsabilidades:

- exibir carteira do evento
- mostrar saldo
- permitir carregamento de saldo via PIX como fluxo principal da demo
- listar estabelecimentos
- exibir cobranca pendente
- permitir confirmar pagamento
- exibir historico

### Superficie 2. Console ou tela simplificada do estabelecimento

Responsabilidades:

- selecionar estabelecimento mockado
- informar valor da cobranca
- iniciar cobranca para o frequentador
- exibir status basico da cobranca

Observacao:

nao precisa ser um PDV completo. Pode ser uma interface simplificada de demo, desde que represente bem o caso de uso real.

## Fluxos que devem existir

### Fluxo 1. Entrada na carteira

- abrir o app do frequentador
- visualizar nome do evento
- visualizar saldo atual
- visualizar estabelecimentos disponiveis

### Fluxo 2. Carregamento de saldo

- acionar carregamento
- escolher valor predefinido
- gerar cobranca PIX
- acompanhar status da recarga
- ver saldo atualizado

### Nivel de demonstracao esperado para a recarga

Para esta apresentacao, a recarga deve ter integracao PIX.

Nivel minimo aceitavel:

1. criacao de cobranca PIX
2. exibicao de dados de pagamento como QR code e copia e cola, se disponiveis
3. retorno de status da recarga
4. confirmacao da entrada no ledger e no historico

Sem isso, a demo nao atende ao objetivo desta apresentacao.

### Fluxo 3. Cobranca iniciada pelo estabelecimento

- operador do estabelecimento define valor
- sistema cria cobranca pendente
- frequentador recebe ou visualiza a cobranca

### Fluxo 4. Pagamento

- frequentador revisa cobranca
- confirma pagamento
- sistema debita o ledger do frequentador
- sistema credita o ledger logico do estabelecimento
- ambos visualizam sucesso

### Fluxo 5. Historico

- frequentador consulta historico
- visualiza recarga e consumo

## Fluxos de erro obrigatorios

1. recarga PIX expirada ou nao paga
2. saldo insuficiente
3. cobranca cancelada ou expirada
4. falha de processamento

## Modelo de dados minimo para a demo

### Entidades

- `event`
- `consumerWallet`
- `merchant`
- `charge`
- `ledgerEntry`
- `transactionHistoryItem`

### Regras minimas

- saldo nunca pode ficar negativo
- toda recarga cria entrada positiva no ledger do frequentador
- todo pagamento cria uma saida no ledger do frequentador
- todo pagamento cria uma entrada logica no ledger do estabelecimento
- historico sempre reflete ledger, mesmo em mock

## Roteiro sugerido de apresentacao

1. Mostrar o evento e a carteira pronta
2. Mostrar saldo baixo ou zerado
3. Fazer carregamento de saldo via PIX
4. Mostrar um estabelecimento iniciando cobranca
5. Mostrar o frequentador revisando e pagando
6. Mostrar saldo atualizado
7. Mostrar historico
8. Explicar que o credito ao estabelecimento e logico, para futura liquidacao

## Criticos de experiencia

### O que precisa ficar muito claro

- o que esta sendo cobrado
- quem esta cobrando
- qual o saldo antes e depois
- que a operacao foi concluida
- que o estabelecimento recebeu credito logico

### O que nao pode confundir

- pagamento financeiro real versus transferencia logica
- recarga via PIX versus credito interno de consumo
- escolha do estabelecimento versus cobranca iniciada por ele

## Recomendacao de narrativa

Para esta demo, o fluxo principal deve ser:

1. frequentador entra na carteira
2. frequentador recarrega
3. estabelecimento inicia cobranca
4. frequentador confirma
5. sistema registra a movimentacao nos dois lados

Esse fluxo comunica melhor o ambiente real do evento do que um fluxo totalmente self-service.

Para o publico de pagamentos, a etapa 2 deve receber mais destaque do que a etapa 4 na narrativa verbal.

## Sequencia de implementacao recomendada

### Etapa 1. Fundacao da demo

- definir dados mockados
- definir entidades e regras do ledger
- estruturar shell da demo
- definir navegacao minima

### Etapa 2. Carteira do frequentador

- home da carteira
- saldo
- lista de estabelecimentos
- historico

### Etapa 3. Carregamento de saldo

- selecao de valores
- integracao com PIX
- atualizacao de ledger e historico

- adicionar QR de cobranca, copia e cola e estados de processamento
- adicionar confirmacao assincrona de sucesso
- mostrar correlacao entre recarga e entrada no ledger

### Etapa 4. Interface simplificada do estabelecimento

- selecao do estabelecimento
- criacao de cobranca
- status da cobranca

### Etapa 5. Pagamento

- recebimento da cobranca pelo frequentador
- revisao
- confirmacao
- atualizacao sincronizada dos dados mockados

### Etapa 6. Estados de erro e polimento

- saldo insuficiente
- expiracao
- cancelamento
- feedback visual forte para sucesso e falha

## Criterios de sucesso da demo

1. qualquer pessoa entende a proposta em menos de 2 minutos
2. o fluxo principal roda sem explicacao tecnica excessiva
3. a diferenca entre saldo do frequentador e credito logico do estabelecimento fica clara
4. a experiencia parece mais simples do que cartao fisico e fila de recarga
5. a demo nao promete algo que ainda nao existe
6. o carregamento de saldo funciona via PIX de forma demonstravel

## Riscos desta abordagem

### Risco 1. A demo parecer superficial demais

Mitigacao:

- modelar ledger com consistencia
- mostrar historico e efeitos da operacao

### Risco 2. O publico achar que ja existe integracao real

Mitigacao:

- marcar claramente o que esta mockado
- explicar o que e liquidacao logica

### Risco 4. A recarga parecer superficial demais

Mitigacao:

- tornar a recarga integrada de verdade ao fluxo PIX
- mostrar estados de criacao, processamento e confirmacao
- refletir a recarga imediatamente no ledger e no historico

### Risco 3. Tentar simular superficie demais

Mitigacao:

- nao construir painel do organizador agora
- nao construir PDV completo agora
- usar interface de cobranca simplificada

## Decisao recomendada

Seguir com um MVP de apresentacao centrado em:

- carteira do frequentador
- recarga via PIX
- cobranca do estabelecimento
- ledger logico

e adiar o restante das superfices para a fase seguinte.
