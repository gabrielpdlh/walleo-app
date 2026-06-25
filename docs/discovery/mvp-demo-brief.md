# Brief do MVP de Apresentacao

## Objetivo

Definir o recorte do MVP que sera apresentado agora, priorizando demonstracao de valor do produto sem depender da construcao completa do painel do organizador nem do app operacional completo do estabelecimento.

## Tese da demonstracao

O produto precisa provar, nesta fase, que a experiencia central faz sentido:

- o frequentador possui uma carteira vinculada ao evento;
- ele consegue carregar saldo via PIX;
- um estabelecimento inicia uma cobranca;
- o frequentador paga com a carteira;
- o sistema movimenta saldo de um ledger logico do frequentador para um ledger logico do estabelecimento;
- o usuario entende o que aconteceu e confia no fluxo.

## Pergunta que a demo responde

"Se substituirmos cartao fisico e recarga manual por carteira digital e cobranca em fluxo guiado, a experiencia parece clara, fluida e convincente?"

## Escopo do recorte

### Dentro do escopo

- evento mockado
- frequentador mockado
- estabelecimentos mockados
- carregamento de saldo com integracao PIX
- listagem de estabelecimentos
- iniciacao de cobranca por estabelecimento
- confirmacao de pagamento pelo frequentador
- movimentacao de ledger logico
- historico basico da transacao
- estados de sucesso, erro e saldo insuficiente

### Fora do escopo

- painel do organizador
- importacao de frequentadores
- dashboard administrativo
- repasse financeiro real
- autenticacao completa por perfis
- PDV offline real
- operacao multiusuario real
- conciliacao e webhook reais

## Mensagem principal da demo

O produto nao esta mostrando a plataforma operacional completa, mas precisa mostrar de forma forte:

- como o saldo entra na carteira;
- como o saldo e consumido no evento;
- como o consumo gera credito logico para o estabelecimento.

Na apresentacao, o produto nao deve parecer apenas um mock de interface. Ele precisa transmitir:

- experiencia do frequentador
- entrada de saldo via PIX como momento central da jornada
- dinamica de cobranca no evento
- logica de movimentacao interna de saldo
- base conceitual do closed-loop wallet

## Artefatos que a demo precisa comunicar

1. Carteira do frequentador
2. Carregamento de saldo
3. Escolha ou contexto de estabelecimento
4. Cobranca iniciada pelo estabelecimento
5. Confirmacao do pagamento
6. Debito no ledger do frequentador
7. Credito logico no ledger do estabelecimento
8. Historico da operacao

## Posicionamento correto

Durante a apresentacao, a equipe deve deixar explicito:

- a recarga usa integracao PIX nesta demonstracao
- a transferencia nao e PIX entre frequentador e estabelecimento
- o que se move e saldo logico dentro do ecossistema do evento
- a prova aqui combina experiencia de usuario com entrada realista de saldo

## Recomendacao adicional para este publico

Como a apresentacao sera para uma empresa de pagamentos, o fluxo de carregamento de saldo deve ser o trecho mais forte da demo.

Para esta apresentacao, a integracao com PIX passa a ser obrigatoria no recorte do MVP.

Isso significa:

1. a recarga nao pode ser apenas um mock visual
2. o fluxo precisa refletir criacao, acompanhamento e confirmacao da recarga
3. o saldo da carteira deve responder ao resultado do fluxo PIX
