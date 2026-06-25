# Stack Tecnica Recomendada

## Objetivo

Selecionar uma stack que sustente:

- MVP rapido;
- tres superfices de frontend com necessidades diferentes;
- base testavel e modular;
- evolucao futura sem reescrita.

## Escolhas recomendadas

| Camada | Escolha | Motivo |
| --- | --- | --- |
| Framework principal | Next.js 16 | Base moderna, App Router, bom equilibrio entre SSR, client interactivity e operacao web. |
| Biblioteca de UI | React 19 | Alinha com o ecossistema do Next e facilita composicao por componentes. |
| Linguagem | TypeScript strict | Melhora seguranca de refatoracao e contratos. |
| Estilo | Tailwind CSS 4 | Rapidez no MVP com boa padronizacao visual se combinado com design tokens. |
| Estado de servidor | TanStack Query | Cache, sincronizacao e tratamento de estado remoto com padroes maduros. |
| Validacao | Zod | Contratos seguros entre UI e API, parsing e mensagens previsiveis. |
| Formularios | React Hook Form | Bom desempenho e baixa verbosidade para formularios ricos. |
| PWA | Serwist | Integracao atual com Next e controle melhor de service worker e cache. |
| Persistencia local do PDV | IndexedDB | Necessaria para fila offline e sincronizacao posterior. |
| Testes unitarios | Vitest | Boa ergonomia e velocidade para bibliotecas frontend em TypeScript. |
| Testes de UI | Testing Library | Foco em comportamento do usuario. |
| E2E | Playwright | Bom suporte a jornadas web complexas e dispositivos moveis. |

## Escolhas evitadas neste momento

| Opcao | Motivo para nao adotar agora |
| --- | --- |
| Um unico app com todas as superficies misturadas | Aumenta acoplamento entre contexts distintos. |
| Store global pesada como padrao | Complica manutencao antes de existir necessidade real. |
| Biblioteca de componentes externa como centro da arquitetura | Pode acelerar prototipo, mas tende a impor linguagem visual e contratos cedo demais. |
| App nativo para frequentador ou PDV no MVP | Contraria o documento-fonte, que prioriza PWA. |

## Observacoes de compatibilidade

- O projeto atual ja usa Next.js, React, TypeScript e Tailwind.
- A versao local de Node recomendada para o projeto esta fixada em `.nvmrc`.
- O app atual ainda e bootstrap inicial; a organizacao multi-app proposta deve acontecer antes do desenvolvimento funcional do produto.

## Confirmacoes em fontes oficiais

As recomendacoes acima foram validadas contra documentacao oficial ou primaria destes projetos:

- Next.js App Router: `nextjs.org`
- TanStack Query: `tanstack.com`
- Zod: `zod.dev`
- Serwist para integracao PWA com Next: `serwist.pages.dev`
