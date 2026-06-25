# Plano de Implementacao do Frontend

## Objetivo

Definir uma sequencia de implementacao para o frontend do produto, reduzindo risco de retrabalho e priorizando a primeira entrega no painel do organizador.

## Premissas

- O time atual e responsavel apenas pelo frontend.
- O backend sera implementado em paralelo ou posteriormente por outra frente.
- O objetivo imediato nao e entregar todas as telas, mas organizar a fundacao, os contratos esperados e a sequencia correta de construcao.
- O painel do organizador sera a primeira superficie de implementacao.

## Principios de execucao

1. Construir fundacao antes de features.
2. Implementar fluxos por valor de negocio, nao por entidade isolada.
3. Trabalhar com contratos mockados e validados enquanto o backend nao estiver pronto.
4. Evitar acoplamento entre organizador, frequentador e PDV.
5. Criar componentes compartilhados somente apos dois usos claros.

## Visao macro da implementacao

### Fase 0. Refinamento tecnico

Objetivo:

- reduzir ambiguidades que impactam a implementacao.

Entregas:

- definicao inicial de navegacao do painel;
- matriz de perfis e permissoes do organizador;
- contratos esperados de autenticacao e sessao;
- definicao inicial dos payloads de evento, estabelecimento, importacao, dashboard, transacao e repasse;
- alinhamento com backend sobre erros, paginação, filtros e tempo real.

Bloqueadores principais:

- contrato de autenticacao;
- estrategia de atualizacao em tempo real do dashboard;
- formato das exportacoes;
- estrutura de permissao por perfil.

### Fase 1. Fundacao do frontend

Objetivo:

- preparar a base tecnica para o painel do organizador.

Entregas:

- setup do app `organizer-web`;
- configuracao de aliases, lint, typecheck e testes;
- shell autenticado do painel;
- design tokens iniciais;
- biblioteca base de componentes administrativos;
- infraestrutura de HTTP client, query client, tratamento de erros e telemetria;
- estrutura por feature com camadas `domain`, `application`, `infrastructure`, `presentation`;
- mocks e fixtures dos contratos principais.

### Fase 2. MVP do painel do organizador

Objetivo:

- cobrir os fluxos administrativos criticos do MVP.

Entregas:

- onboarding do organizador;
- configuracao de credenciais Confrapag;
- criacao e edicao de evento;
- cadastro de estabelecimentos e operadores;
- importacao de frequentadores por CSV;
- dashboard do evento;
- consulta de transacoes;
- fluxo de repasse;
- encerramento do evento.

### Fase 3. Hardening do painel

Objetivo:

- deixar o painel pronto para handoff seguro e continuidade do MVP.

Entregas:

- controle por perfis;
- estados de erro e vazio bem definidos;
- observabilidade de frontend;
- cobertura de testes dos fluxos criticos;
- acessibilidade basica;
- documentacao operacional do frontend.

### Fase 4. Expansao para as outras superfices

Objetivo:

- reaproveitar a fundacao e iniciar `consumer-pwa` e `pdv-pwa`.

Entregas:

- contratos compartilhados refinados;
- design system reutilizavel;
- convencoes de features consolidadas;
- shell inicial das outras superficies.

## Ordem recomendada de implementacao

1. Fundacao tecnica do painel
2. Autenticacao e shell
3. Gestao de evento
4. Gestao de estabelecimentos
5. Importacao de frequentadores
6. Dashboard operacional
7. Consulta de transacoes
8. Repasses
9. Encerramento de evento
10. Perfis e refinamentos

## Dependencias externas do frontend

- definicao de API de autenticacao
- definicao de API de organizador e evento
- definicao de API de estabelecimentos e operadores
- definicao de API de importacao CSV
- definicao de API de dashboard
- definicao de API de transacoes com filtros
- definicao de API de repasses e fechamento

## Estrategia de mocks

Enquanto o backend nao estiver disponivel, o frontend deve trabalhar com:

- schemas `zod` para contratos esperados;
- fixtures por feature;
- mock service layer;
- cenarios de sucesso, vazio, erro, timeout e permissao negada.

## Criterios de pronto da fase de painel

- as features criticas do organizador navegam ponta a ponta com mocks realistas;
- os contratos esperados estao documentados;
- as telas possuem estados de loading, vazio, erro e sucesso;
- os fluxos principais possuem teste automatizado;
- o codigo respeita a separacao por camadas definida na arquitetura;
- o painel esta pronto para integracao progressiva com backend real.
