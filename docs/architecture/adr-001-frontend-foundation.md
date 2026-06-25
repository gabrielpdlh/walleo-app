# ADR-001: Fundacao do Frontend

## Status

Aceito para discovery e planejamento.

## Contexto

O produto possui tres superfices de frontend distintas no MVP:

- painel do organizador;
- app do frequentador;
- app do estabelecimento (PDV).

O documento-fonte tambem impone requisitos fortes de:

- mobile-first;
- PWA;
- operacao offline no PDV;
- boa separacao de responsabilidades;
- futura escalabilidade para multiplos eventos e organizadores.

## Decisao

O frontend sera planejado como monorepo com apps separados por superficie e pacotes compartilhados, usando Next.js 16, React 19 e TypeScript strict como base comum.

## Consequencias positivas

- separa contextos com requisitos diferentes;
- reduz acoplamento entre painel, carteira e PDV;
- facilita testes por jornada;
- melhora clareza de ownership por area;
- cria base melhor para offline-first no PDV;
- permite evolucao incremental de design system e contratos.

## Custos e trade-offs

- setup inicial maior do que um unico app;
- necessidade de governanca minima de pacotes compartilhados;
- onboarding tecnico um pouco mais exigente para a equipe.

## Alternativas consideradas

### 1. Um unico app Next.js com todas as superfices

Rejeitada para o planejamento principal porque:

- mistura contexts com ciclos e restricoes diferentes;
- aumenta risco de dependencia cruzada;
- dificulta tratar o PDV como app especializado.

### 2. Apps totalmente separados em repositorios diferentes

Rejeitada para o MVP porque:

- aumenta overhead operacional cedo demais;
- dificulta compartilhamento de componentes, contratos e testes;
- atrasa a consolidacao de padroes do produto.

## Revisao futura

Esta ADR deve ser revisitada quando houver:

- definicao final do time de desenvolvimento;
- confirmacao dos contratos do backend;
- validacao pratica do comportamento offline do PDV;
- necessidade real de separar deploys ou ownership por squad.
