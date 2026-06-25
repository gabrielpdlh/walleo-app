# Telas Iniciais do MVP

## Objetivo

Documentar o conjunto inicial de telas do MVP, alinhado ao recorte da demo para a Confrapag e ao fluxo principal do produto.

## Princípio de escopo

Nesta fase, o foco não é construir a plataforma completa. O foco é demonstrar, com clareza:

- acesso à carteira;
- recarga via PIX;
- cobrança iniciada pelo estabelecimento;
- confirmação do pagamento;
- atualização do saldo e do histórico.

Por isso, as telas iniciais devem cobrir o fluxo principal do frequentador e uma interface simplificada do estabelecimento.

## Conjunto inicial de telas

## 1. Tela de entrada e acesso

### Objetivo

Permitir que o frequentador entre na experiência da carteira.

### Funções esperadas

- acesso por magic link;
- fallback futuro por CPF ou atendimento assistido;
- identificação do evento quando aplicável.

### Observações

Mesmo que o MVP de apresentação não implemente todos os caminhos alternativos, esta tela deve ser pensada para suportá-los.

## 2. Tela da carteira do evento

### Objetivo

Ser a home principal do frequentador.

### Informações esperadas

- nome do evento;
- saldo atual;
- acesso à recarga;
- acesso ao extrato;
- acesso à lista de estabelecimentos;
- status geral da carteira.

### Papel na demo

Esta tela ancora a narrativa do produto.

## 3. Tela de recarga via PIX

### Objetivo

Permitir gerar a cobrança PIX para entrada de saldo na carteira.

### Funções esperadas

- seleção de valor;
- criação da cobrança PIX;
- exibição de QR code;
- exibição de código copia e cola;
- identificação do status da recarga.

### Observações

Como a apresentação será para uma empresa de pagamentos, esta é uma das telas mais críticas do MVP.

## 4. Tela de acompanhamento da recarga

### Objetivo

Mostrar o andamento da cobrança PIX até a confirmação ou falha.

### Estados esperados

- aguardando pagamento;
- processando;
- confirmado;
- expirado;
- falhou.

### Papel na demo

Comprovar que a entrada de saldo não é apenas um incremento visual, e sim um fluxo de pagamento com estados.

## 5. Tela de estabelecimentos

### Objetivo

Mostrar os estabelecimentos disponíveis no evento.

### Informações esperadas

- nome;
- categoria;
- status operacional simples, se necessário.

### Papel na demo

Dar contexto ao consumo dentro do evento.

## 6. Tela de cobrança pendente e revisão de pagamento

### Objetivo

Permitir que o frequentador visualize uma cobrança aberta e confirme o pagamento.

### Informações esperadas

- estabelecimento que está cobrando;
- valor;
- descrição opcional;
- saldo antes da confirmação;
- ação de confirmar pagamento.

### Papel na demo

É a tela central do momento de consumo.

## 7. Tela de sucesso e comprovante

### Objetivo

Confirmar ao frequentador que o pagamento foi concluído.

### Informações esperadas

- valor debitado;
- estabelecimento;
- saldo atualizado;
- confirmação de que a transação foi registrada.

### Observações

É importante comunicar que o estabelecimento recebeu crédito lógico, não uma liquidação financeira direta naquele instante.

## 8. Tela de extrato e histórico

### Objetivo

Permitir ao frequentador revisar recargas e consumos.

### Informações esperadas

- recargas PIX;
- compras realizadas;
- data e hora;
- valor;
- saldo resultante ou referência de movimentação.

### Papel na demo

Provar transparência e coerência do ledger da carteira.

## 9. Tela simplificada do estabelecimento para iniciar cobrança

### Objetivo

Permitir simular a ação do estabelecimento sem construir o PDV completo.

### Funções esperadas

- selecionar estabelecimento mockado;
- informar valor;
- iniciar a cobrança;
- acompanhar status básico.

### Observações

Esta tela não precisa ser apresentada como “produto final do estabelecimento”. Ela pode ser assumida como interface operacional simplificada para demo.

## 10. Tela de status da cobrança do estabelecimento

### Objetivo

Mostrar ao operador do estabelecimento se a cobrança foi:

- criada;
- pendente;
- paga;
- expirada;
- cancelada.

### Papel na demo

Fechar o ciclo entre quem cobra e quem paga.

## 11. Tela de acesso assistido ou fallback operacional

### Objetivo

Preparar o produto para cenários em que o fluxo ideal falha.

### Cenários atendidos

- e-mail digitado errado;
- webhook não recebido;
- usuário sem smartphone;
- usuário que precisa de atendimento presencial.

### Observações

Pode não entrar na primeira demo visual, mas deve existir como tela prevista no escopo para o MVP real.

## Recorte mínimo recomendado para a primeira versão

Se precisarmos reduzir o esforço inicial, as 7 telas prioritárias são:

1. entrada e acesso
2. carteira do evento
3. recarga via PIX
4. acompanhamento da recarga
5. cobrança pendente e revisão de pagamento
6. sucesso e comprovante
7. extrato e histórico

## Telas fora do escopo inicial

Nesta fase, não entram:

- painel do organizador;
- dashboard administrativo;
- gestão de estabelecimentos;
- fluxo de repasse;
- telas completas de operador/PDV;
- conciliação administrativa;
- relatórios internos.

## Fluxo principal coberto por essas telas

1. usuário entra
2. visualiza carteira
3. recarrega via PIX
4. saldo é confirmado
5. estabelecimento inicia cobrança
6. usuário revisa e confirma pagamento
7. sistema registra débito e crédito lógico
8. usuário consulta extrato
