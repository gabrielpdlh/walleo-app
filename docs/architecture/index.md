# Arquitetura de Frontend

## Objetivo

Esta pasta concentra a arquitetura inicial do frontend do MVP de carteira digital para eventos. O foco e:

- documentar o contexto e os requisitos relevantes ao frontend;
- definir uma base arquitetural preparada para evolucao;
- registrar decisoes tecnicas sem antecipar implementacoes nao validadas.

## Fonte de verdade atual

O ponto de partida desta documentacao e o documento de visao e requisitos:

- `/Users/marcoswiendl/Downloads/TAP_Carteira_Digital_Eventos.docx`

Sempre que houver conflito entre esta documentacao e o documento-fonte, o time deve revisar a divergencia antes de implementar.

## Escopo desta arquitetura

Esta arquitetura cobre apenas o frontend:

- painel do organizador;
- aplicacao do frequentador;
- aplicacao do estabelecimento (PDV);
- fundamentos compartilhados de UI, experiencia, contratos de integracao e observabilidade do frontend.

Fora do escopo desta pasta:

- implementacao do backend;
- desenho detalhado do banco;
- infraestrutura de producao;
- definicao juridica e comercial final.

## Mapa de documentos

- [frontend-architecture.md](./frontend-architecture.md): visao arquitetural principal.
- [frontend-implementation-plan.md](./frontend-implementation-plan.md): plano macro de implementacao do frontend.
- [organizer-panel-implementation-plan.md](./organizer-panel-implementation-plan.md): plano detalhado da primeira frente, o painel do organizador.
- [tech-stack.md](./tech-stack.md): stack recomendada para o frontend e justificativas.
- [source-tree.md](./source-tree.md): estrutura sugerida do repositorio e dos apps.
- [coding-standards.md](./coding-standards.md): principios de SOLID, clean code e organizacao de codigo.
- [adr-001-frontend-foundation.md](./adr-001-frontend-foundation.md): decisao arquitetural principal para a base do frontend.
- [../discovery/frontend-requirements.md](../discovery/frontend-requirements.md): requisitos e restricoes de frontend extraidos do documento-fonte.
- [../discovery/open-questions.md](../discovery/open-questions.md): pontos em aberto que impactam arquitetura e planejamento.

## Status

Fase atual: discovery e arquitetura.

Nao ha implementacao funcional do produto ainda. Os documentos desta pasta existem para orientar backlog, refinamento tecnico e futuras stories.
