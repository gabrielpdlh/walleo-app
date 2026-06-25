# Estrutura Sugerida do Repositorio

## Objetivo

Organizar o frontend para suportar multiplos apps com compartilhamento controlado de codigo.

## Estrutura alvo

```text
.
|-- apps/
|   |-- organizer-web/
|   |   |-- app/
|   |   |-- src/
|   |   |   |-- features/
|   |   |   |-- shared/
|   |   |   |-- lib/
|   |   |   `-- instrumentation/
|   |   `-- public/
|   |-- consumer-pwa/
|   |   |-- app/
|   |   |-- src/
|   |   |   |-- features/
|   |   |   |-- shared/
|   |   |   |-- lib/
|   |   |   `-- instrumentation/
|   |   `-- public/
|   `-- pdv-pwa/
|       |-- app/
|       |-- src/
|       |   |-- features/
|       |   |-- shared/
|       |   |-- lib/
|       |   |-- offline/
|       |   `-- instrumentation/
|       `-- public/
|-- packages/
|   |-- ui/
|   |-- shared/
|   |-- api-contracts/
|   |-- config/
|   `-- testing/
|-- docs/
|   |-- architecture/
|   `-- discovery/
`-- tooling/
```

## Estrutura interna por feature

Cada feature relevante deve seguir um padrao previsivel:

```text
features/
`-- wallet/
    |-- domain/
    |-- application/
    |-- infrastructure/
    |-- presentation/
    |-- tests/
    `-- index.ts
```

## Responsabilidades por area

### `apps/*`

Concentram:

- rotas;
- layouts;
- composicao de paginas;
- entrypoints de cada superficie;
- assets especificos do app.

### `packages/ui`

Concentra:

- design tokens;
- primitives;
- componentes compartilhados;
- padroes visuais reutilizaveis.

Nao deve conter regra de negocio.

### `packages/shared`

Concentra:

- utilitarios puros;
- tipos transversais;
- helpers de formatacao;
- abstracoes sem dependencia de superficie.

### `packages/api-contracts`

Concentra:

- schemas de request e response;
- modelos de erro;
- contratos versionados de integracao;
- mapeadores de DTO para modelos de frontend.

### `packages/config`

Concentra:

- ESLint;
- TypeScript;
- Vitest;
- Playwright;
- convencoes reaproveitaveis entre apps.

### `packages/testing`

Concentra:

- factories;
- mocks;
- render helpers;
- doubles de infraestrutura;
- utilitarios de teste cross-app.

## Estrutura atual x estrutura alvo

Estrutura atual:

- um unico app Next na raiz;
- sem separacao por superficie;
- sem workspace de pacotes compartilhados.

Estrutura alvo:

- monorepo com apps independentes;
- compartilhamento por pacotes;
- organizacao por dominio e casos de uso.

## Regra pratica

Se um modulo nao puder ser reutilizado por ao menos duas areas ou nao representar claramente uma responsabilidade isolada, ele nao deve ser promovido cedo para `packages/`.
