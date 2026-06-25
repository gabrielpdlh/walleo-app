# Arquitetura de Frontend

## 1. Contexto

O produto e uma plataforma de carteira digital fechada para eventos, com tres experiencias primarias sob responsabilidade do frontend:

- painel web do organizador;
- app do frequentador, mobile-first;
- app do estabelecimento (PDV), mobile-first e com operacao tolerante a conectividade instavel.

O MVP precisa ser simples o suficiente para validar o negocio, mas a base tecnica precisa suportar evolucao para:

- multiplos eventos e organizadores;
- novas integracoes de bilheteria;
- novos gateways de pagamento;
- maior maturidade de UX, observabilidade e seguranca.

## 2. Diretrizes arquiteturais

As decisoes de frontend devem obedecer a estas diretrizes:

1. Comecar com baixa complexidade operacional, sem sacrificar separacao de responsabilidades.
2. Isolar regras de dominio e integracoes de UI para evitar acoplamento prematuro.
3. Tratar o PDV como superficie especial por causa de offline, camera, performance e anti-fraude.
4. Manter contratos claros com o backend, sem espalhar `fetch` e formatos de payload pela interface.
5. Favorecer composicao, modulos pequenos e testabilidade.
6. Preparar o repositorio para crescer para multiplos apps sem reescrita estrutural.

## 3. Decisao principal

### Recomendacao

Adotar um frontend em monorepo, com apps separados por contexto de uso e pacotes compartilhados.

### Estrutura alvo

- `apps/organizer-web`
- `apps/consumer-pwa`
- `apps/pdv-pwa`
- `packages/ui`
- `packages/shared`
- `packages/api-contracts`
- `packages/config`
- `packages/testing`

### Justificativa

Essa separacao atende melhor o dominio do produto do que um unico app com tudo misturado:

- o painel do organizador tem perfil administrativo, formularios, dashboards e permissao por papeis;
- o app do frequentador privilegia onboarding rapido, saldo, recarga e QR temporario;
- o PDV exige camera, feedback imediato, fluxo operacional simples e comportamento offline-first.

Mesmo que o MVP comece com equipe pequena, esses tres contextos ja possuem ciclos de evolucao e requisitos nao funcionais diferentes. A separacao por app reduz acoplamento de UI, risco de regressao cruzada e complexidade cognitiva.

## 4. Stack recomendada

### Base

- Next.js 16 com App Router
- React 19
- TypeScript strict

### Dados e validacao

- `@tanstack/react-query` para estado de servidor
- `zod` para validacao de contratos de entrada e saida
- `react-hook-form` para formularios

### UI e design system

- Tailwind CSS 4
- componentes internos em `packages/ui`
- tokens de design centralizados para cor, tipografia, espacamento e estados

### PWA e offline

- `@serwist/next` para service worker e estrategias de cache
- IndexedDB para fila local e armazenamento operacional do PDV

### Testes

- Vitest para unidade
- Testing Library para comportamento de UI
- Playwright para fluxos criticos end-to-end

## 5. Modelo de camadas

Cada feature relevante deve seguir um desenho inspirado em Clean Architecture:

- `domain`
- `application`
- `infrastructure`
- `presentation`

### 5.1. Domain

Contem regras puras e tipos do negocio de frontend:

- carteira;
- recarga;
- consumo;
- politica de saldo residual;
- status de sincronizacao;
- permissao por papel;
- estados de QR.

### 5.2. Application

Orquestra casos de uso do frontend:

- autenticar por magic link;
- carregar painel do evento;
- criar recarga;
- confirmar geracao de QR com PIN;
- sincronizar vendas offline do PDV;
- encerrar turno.

### 5.3. Infrastructure

Concentra adaptadores tecnicos:

- clientes HTTP;
- persistencia local;
- integracao com camera;
- service worker;
- telemetria;
- armazenamento seguro de sessao no cliente.

### 5.4. Presentation

Contem:

- paginas;
- layouts;
- componentes de tela;
- formularios;
- feedback visual;
- navegacao.

Componentes visuais nao devem conter regras de negocio complexas nem conhecer detalhes de payload do backend.

## 6. Estrategia por superficie

### 6.1. Painel do organizador

Foco funcional:

- onboarding do organizador;
- configuracao de credenciais;
- gestao de evento;
- estabelecimentos;
- importacao de frequentadores;
- dashboards;
- consulta de transacoes;
- repasses;
- fechamento do evento.

Direcionadores tecnicos:

- areas autenticadas por perfil;
- formularios ricos e tabelas com filtros;
- telas de status operacional;
- exportacao e rastreabilidade.

### 6.2. App do frequentador

Foco funcional:

- magic link;
- criacao e confirmacao de PIN;
- consulta de saldo;
- recarga via PIX;
- QR de pagamento;
- historico;
- resgate de saldo residual.

Direcionadores tecnicos:

- entrada rapida;
- linguagem simples;
- boa performance em rede movel;
- sincronizacao frequente do saldo;
- experiencia mobile-first.

### 6.3. PDV

Foco funcional:

- login do operador;
- leitura de QR por camera;
- validacao local;
- venda online ou offline;
- sincronizacao posterior;
- totalizador;
- fechamento de turno.

Direcionadores tecnicos:

- offline-first;
- alta legibilidade em campo;
- baixo tempo de resposta local;
- protecao contra reuso do QR;
- indicacao visual do estado de conectividade.

## 7. Fronteira com backend

O frontend nao deve depender de formatos crus de API espalhados pelo codigo.

Padrao recomendado:

- `packages/api-contracts` define schemas e tipos compartilhados do frontend;
- cada feature consome um client proprio em `infrastructure`;
- respostas externas sao validadas com `zod` antes de chegar a `application`;
- o restante da aplicacao trabalha com modelos normalizados.

## 8. Estado e cache

Separacao recomendada:

- estado de servidor: TanStack Query;
- estado efemero de interface: React local;
- estado de fluxo compartilhado entre componentes de uma tela: contexto local ou store pequena por feature;
- fila offline do PDV: IndexedDB, fora da arvore React;
- sessao e preferencias: modulo de storage com interface propria.

Nao usar store global como default. Estado global so deve existir quando houver necessidade clara de compartilhamento entre multiplas features ou layout persistente.

## 9. Seguranca e privacidade no frontend

O frontend deve refletir e reforcar os RNFs do produto:

- nunca expor tokens sensiveis em logs de navegador;
- mascarar credenciais do gateway na UI do organizador;
- exigir flows claros para PIN, expiracao e reautenticacao;
- impedir exibicao de dados sensiveis fora de contexto;
- registrar consentimento e aceitar politicas no primeiro acesso;
- tratar QR como artefato sensivel com validade curta e mensagens claras de expiracao.

## 10. Observabilidade do frontend

Desde o MVP, o frontend deve suportar:

- correlation id por requisicao, quando fornecido pelo backend;
- captura de erros por app e por rota;
- metricas de UX dos fluxos criticos;
- eventos de produto para onboarding, recarga, geracao de QR, validacao, falha de sincronizacao e repasse visualizado.

## 11. Estrategia de qualidade

### Testes prioritarios

- unidade para mapeadores, validadores e regras de exibicao;
- integracao para hooks de casos de uso;
- componentes para formularios e estados de erro;
- E2E para jornadas criticas.

### Jornadas criticas do MVP

1. organizador cria evento e cadastra estabelecimento;
2. organizador importa frequentadores;
3. frequentador acessa por magic link e define PIN;
4. frequentador gera recarga e visualiza saldo;
5. frequentador gera QR com PIN;
6. PDV le QR, informa valor e conclui venda;
7. PDV opera offline e sincroniza depois;
8. organizador fecha evento e acompanha repasses.

## 12. Evolucao planejada

### Fase 1: discovery

- consolidar requisitos;
- decidir stack final;
- fechar contratos de tela;
- validar arquitetura com backend e produto.

### Fase 2: fundacao

- estruturar monorepo;
- publicar design tokens;
- criar shell dos tres apps;
- definir autenticacao, navegacao e observabilidade base.

### Fase 3: MVP funcional

- implementar fluxos prioritarios;
- cobrir jornadas criticas;
- validar em ambiente de homologacao.

### Fase 4: preparacao para escala

- endurecimento de seguranca;
- amadurecimento de analytics;
- melhoria de resiliencia offline;
- otimizacao de performance e governanca de componentes.

## 13. Assuncoes registradas

- o frontend sera responsavel por tres superfices distintas desde o MVP;
- o backend sera externo ao escopo deste time, mas com contratos alinhados cedo;
- o repositorio atual pode ser evoluido para monorepo antes do inicio da implementacao real;
- nao ha decisao final ainda sobre hospedagem, autenticacao de organizador ou biblioteca de componentes.

## 14. Itens que exigem validacao antes de implementar

- estrategia exata de PWA e permissao de camera para o PDV;
- contrato de autenticacao entre frontend e backend;
- comportamento do magic link em multiplos dispositivos;
- fluxo de reemissao de QR e limites anti-fraude no offline;
- formato e latencia esperada dos dashboards em tempo real;
- regras finais da politica de saldo residual;
- necessidades de branding e identidade visual do produto.
