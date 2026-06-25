# Walleo-Events

Frontend para a plataforma de eventos da Walleo. Este projeto está em fase de discovery e arquitetura para o MVP de uma carteira digital para eventos.

## Visão Geral do Projeto

Este repositório contém o frontend da aplicação, construído com Next.js e TypeScript. O projeto foi inicializado e estruturado com uma série de commits granulares para garantir um histórico claro e organizado desde o início.

## Status Atual

- **Repositório Inicializado**: O projeto foi versionado com Git, com uma estrutura de commits iniciais bem definida.
- **Base do Código**: A estrutura inicial do Next.js foi configurada.
- **Configuração**: Ferramentas de qualidade de código como ESLint e TypeScript estão configuradas.
- **Documentação**: A documentação inicial de arquitetura, requisitos e especificações do MVP foi adicionada.
- **Features**: Nenhuma feature de produto foi implementada ainda.

## Começando

Para rodar o projeto localmente, siga os passos abaixo.

1.  **Use a versão correta do Node.js**:
    ```bash
    nvm use # ou fnm use
    ```

2.  **Instale as dependências**:
    ```bash
    npm install
    ```

3.  **Inicie o servidor de desenvolvimento**:
    ```bash
    npm run dev
    ```
    Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## Scripts Disponíveis

-   `npm run dev`: Inicia o servidor de desenvolvimento.
-   `npm run build`: Compila a aplicação para produção.
-   `npm run start`: Inicia um servidor de produção.
-   `npm run lint`: Executa o linter (ESLint) para identificar problemas no código.
-   `npm run typecheck`: Executa o verificador de tipos do TypeScript.

## Estrutura do Projeto

A estrutura de pastas principal é a seguinte:

```
/
├── app/            # Páginas e layouts da aplicação (Next.js App Router)
├── docs/           # Documentação do projeto (arquitetura, specs, etc.)
├── public/         # Arquivos estáticos (imagens, fontes)
├── .github/        # Configurações do GitHub (ex: agentes de IA)
├── AGENTS.md       # Instruções para agentes de IA
├── next.config.ts  # Configuração do Next.js
└── package.json    # Dependências e scripts do projeto
```

## Histórico de Commits Iniciais

O projeto foi inicializado com os seguintes commits:

1.  `chore: Initialize .gitignore with project-specific ignores`
2.  `feat: Add initial project configuration files`
3.  `feat: Add initial application boilerplate`
4.  `docs: Add initial project documentation and AI agent instructions`
5.  `chore: Add environment example and GitHub configuration`

## Próximos Passos

O próximo passo recomendado é refinar as questões em aberto na documentação e transformar a arquitetura em um backlog inicial antes de começar a implementação funcional.
