# Questoes em Aberto

## Objetivo

Registrar pontos que ainda bloqueiam ou influenciam a arquitetura e o planejamento do frontend.

## 1. Decisoes de negocio

1. Qual sera a politica padrao de saldo residual?
Impacto: muda fluxos do frequentador, comunicacao de consentimento e telas de encerramento.

2. Qual modelo comercial sera adotado?
Impacto: pode alterar dashboards, relatorios, fechamento e exibicao de taxas.

3. O nome do produto e a identidade visual ja existem?
Impacto: interfere em design system, branding, copy e estrutura publica do app.

## 2. Decisoes funcionais

1. O KYC do frequentador sera apenas CPF informado ou havera validacao mais forte?
Impacto: altera onboarding, formulacao de telas, validacoes e tratamento de erro.

2. O login do operador do PDV sera usuario e senha, codigo curto, ou ambos?
Impacto: altera UX operacional, treinamento e seguranca.

3. O painel interno de operacoes fara parte do escopo deste frontend ou sera outra frente?
Impacto: influencia a estrutura de apps e prioridades do monorepo.

## 3. Integracao com backend

1. Como sera o contrato de sessao para organizador, frequentador e PDV?
Impacto: define middleware, guards, storage e refresh de credenciais.

2. O backend fornecera contratos versionados ou schema compartilhado?
Impacto: define estrategia de `packages/api-contracts`.

3. Como o saldo em tempo real sera atualizado no painel e no app do frequentador?
Impacto: polling, SSE ou WebSocket mudam bastante a arquitetura da camada de dados.

4. Qual sera a politica de reemissao do QR no frequentador?
Impacto: define estados de tela, expiracao e experiencia de erro no caixa.

## 4. PWA e operacao offline

1. Quais devices serao homologados para o PDV?
Impacto: camera, tamanho de tela, desempenho e cache offline.

2. Qual o limite operacional para vendas offline?
Impacto: influencia mensagens, bloqueios e reconciliacao no frontend.

3. O PDV deve emitir feedback sonoro nativo ou apenas visual?
Impacto: afeta acessibilidade operacional em ambiente ruidoso.

## 5. Juridico e privacidade

1. Quando teremos termo de uso e politica de privacidade definitivos?
Impacto: telas de consentimento, aceite e fluxo de dados.

2. Como sera o fluxo de exportacao e exclusao de dados do frequentador?
Impacto: define telas de conta e operacao administrativa.

## 6. Recomendacao

Antes de iniciar implementacao real, estas respostas devem virar:

- backlog de discovery;
- contratos com backend;
- criterios de aceite das primeiras stories;
- revisao desta documentacao de arquitetura.
