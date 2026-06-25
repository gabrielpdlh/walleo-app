# TAP Eventos

Frontend em fase de discovery e arquitetura para o MVP de carteira digital para eventos.

## Status atual

- AIOX configurado no projeto
- base Next.js inicial criada
- documentacao inicial de requisitos e arquitetura de frontend criada
- nenhuma feature de produto implementada ainda

## Documentacao principal

- [docs/architecture/index.md](./docs/architecture/index.md)
- [docs/architecture/frontend-architecture.md](./docs/architecture/frontend-architecture.md)
- [docs/specs/mvp-demo-spec.md](./docs/specs/mvp-demo-spec.md)
- [docs/discovery/frontend-requirements.md](./docs/discovery/frontend-requirements.md)
- [docs/discovery/open-questions.md](./docs/discovery/open-questions.md)
- [docs/discovery/mvp-demo-brief.md](./docs/discovery/mvp-demo-brief.md)
- [docs/discovery/mvp-demo-plan.md](./docs/discovery/mvp-demo-plan.md)
- [docs/discovery/backend-handoff-initial-needs.md](./docs/discovery/backend-handoff-initial-needs.md)
- [docs/discovery/initial-screens.md](./docs/discovery/initial-screens.md)
- [docs/discovery/required-endpoints.md](./docs/discovery/required-endpoints.md)
- [docs/discovery/initial-domain-model.md](./docs/discovery/initial-domain-model.md)

## Ambiente local

Use a versao de Node definida em `.nvmrc`.

```bash
fnm use
npm install
npm run dev
```

## Validacoes

```bash
npm run lint
npm run typecheck
npm run build
```

## Proximo passo recomendado

Refinar as questoes em aberto e transformar a arquitetura em backlog inicial antes de iniciar implementacao funcional.
