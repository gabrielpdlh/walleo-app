# Plano de Implementacao: Painel do Organizador

## Objetivo

Detalhar a implementacao do painel do organizador como primeira frente do frontend.

## Escopo funcional de partida

Baseado em RF-01 a RF-15, o painel precisa cobrir:

- cadastro e configuracao do organizador;
- configuracao de credenciais do gateway;
- criacao e gestao de eventos;
- cadastro de estabelecimentos e operadores;
- importacao de frequentadores;
- dashboard do evento;
- consulta de transacoes;
- gestao de repasses;
- encerramento do evento.

## Modulos do painel

### 1. Acesso e shell administrativo

Responsabilidades:

- login e sessao;
- layout autenticado;
- navegacao lateral;
- permissao por perfil;
- selecao de organizador e evento quando aplicavel.

Rotas previstas:

- `/login`
- `/dashboard`
- `/organizacao/perfil`
- `/eventos`
- `/eventos/[eventId]`
- `/eventos/[eventId]/estabelecimentos`
- `/eventos/[eventId]/frequentadores`
- `/eventos/[eventId]/transacoes`
- `/eventos/[eventId]/repasses`
- `/eventos/[eventId]/configuracoes`

### 2. Organizacao e credenciais

Responsabilidades:

- cadastro e edicao de dados do organizador;
- configuracao da credencial Confrapag;
- exibicao segura e mascarada do token;
- feedback de validacao da credencial.

Requisitos associados:

- RF-01
- RF-02

### 3. Gestao de eventos

Responsabilidades:

- criar, editar e listar eventos;
- configurar local, periodo, taxa e politica de saldo residual;
- visualizar status do evento.

Requisitos associados:

- RF-03
- RF-13
- RF-15

### 4. Estabelecimentos e operadores

Responsabilidades:

- listar estabelecimentos do evento;
- cadastrar e editar estabelecimento;
- cadastrar operadores autorizados;
- exibir status de configuracao do repasse.

Requisitos associados:

- RF-04

### 5. Frequentadores

Responsabilidades:

- importar CSV;
- acompanhar processamento da importacao;
- listar frequentadores importados;
- suportar estados de erro, linha invalida e reprocessamento.

Requisitos associados:

- RF-05
- RF-06

### 6. Dashboard operacional

Responsabilidades:

- exibir saldo total recarregado;
- total consumido;
- ranking de estabelecimentos;
- numero de carteiras ativas;
- ticket medio.

Requisitos associados:

- RF-07

### 7. Transacoes

Responsabilidades:

- listar transacoes;
- filtrar por periodo, estabelecimento, frequentador e status;
- detalhar transacao.

Requisitos associados:

- RF-08
- RF-09

### 8. Repasses

Responsabilidades:

- listar repasses;
- exibir status;
- disparar repasse manual;
- programar repasse quando suportado;
- reenviar falha.

Requisitos associados:

- RF-10
- RF-11
- RF-12

### 9. Fechamento de evento

Responsabilidades:

- confirmar encerramento;
- bloquear operacoes conflitantes na UI;
- acompanhar status do processamento final.

Requisitos associados:

- RF-15

## Sequencia por ondas

## Onda 1. Fundacao do painel

Objetivo:

- deixar o app pronto para crescer sem refactor estrutural.

Entregas:

- `apps/organizer-web` criado;
- layout base autenticado;
- sistema de rotas;
- infraestrutura de client HTTP;
- provider de query;
- tratamento global de erro;
- biblioteca inicial de componentes administrativos.

Criterio de pronto:

- navegar pelas rotas base com mocks e dados fake;
- padrao de feature replicavel definido.

## Onda 2. Organizacao, login e evento

Objetivo:

- cobrir a espinha dorsal administrativa.

Entregas:

- tela de login;
- sessao mockada;
- perfil do organizador;
- configuracao de credenciais;
- listagem e criacao de eventos;
- tela de detalhes do evento.

Criterio de pronto:

- organizador consegue entrar, configurar o basico e criar o primeiro evento em ambiente mockado.

## Onda 3. Estabelecimentos e frequentadores

Objetivo:

- preparar o evento para operacao real.

Entregas:

- listagem e cadastro de estabelecimentos;
- cadastro de operadores;
- importacao CSV com validacao de arquivo;
- acompanhamento do resultado da importacao;
- listagem de frequentadores.

Criterio de pronto:

- evento fica operacionalmente preparado para receber consumo.

## Onda 4. Dashboard e transacoes

Objetivo:

- dar visibilidade operacional ao organizador.

Entregas:

- dashboard com cards, ranking e indicadores;
- filtros persistentes na URL;
- tabela de transacoes;
- detalhe de transacao;
- exportacao preparada na interface.

Criterio de pronto:

- organizador consegue acompanhar o evento e investigar movimentacoes.

## Onda 5. Repasses e fechamento

Objetivo:

- concluir o ciclo operacional do painel.

Entregas:

- tela de repasses;
- fluxo de disparo manual;
- estados de processamento e falha;
- reenviar repasse;
- fluxo de encerramento de evento.

Criterio de pronto:

- painel cobre o ciclo administrativo completo do MVP.

## Onda 6. Hardening

Objetivo:

- elevar qualidade e preparar integracao real.

Entregas:

- permissao por perfil;
- telemetria de erros e eventos;
- testes E2E dos fluxos criticos;
- revisao de acessibilidade;
- documentacao de integracao por modulo.

## Backlog tecnico transversal

Itens que devem avancar em paralelo:

- tokens e design system administrativo;
- normalizacao de erros de API;
- suporte a paginação, ordenação e filtros;
- wrappers de tabelas e formularios;
- states padronizados de loading, empty e error;
- utilitarios de datas, moeda e mascaras;
- mocks compartilhados;
- factories de testes.

## Riscos de implementacao

### Risco 1. Contratos de backend instaveis

Mitigacao:

- documentar schemas esperados;
- centralizar adaptadores;
- evitar acoplamento de UI ao DTO cru.

### Risco 2. Dashboard depender cedo demais de tempo real

Mitigacao:

- comecar com polling controlado;
- deixar SSE ou WebSocket como evolucao se necessario.

### Risco 3. Escopo do painel crescer demais

Mitigacao:

- manter foco no ciclo administrativo do MVP;
- adiar super-admin interno e relatorios avancados.

### Risco 4. Excesso de abstração antes da hora

Mitigacao:

- compartilhar apenas o que tiver dois usos claros;
- evitar framework interno de componentes no inicio.

## Contratos que precisam ser definidos antes de integrar

- sessao e renovacao de autenticacao;
- perfil e permissoes do organizador;
- CRUD de eventos;
- CRUD de estabelecimentos e operadores;
- upload e resposta da importacao CSV;
- shape do dashboard;
- shape da listagem de transacoes;
- shape da listagem e execucao de repasses;
- status e resposta do encerramento do evento.

## Estrategia de testes

### Unidade

- parsers e mapeadores
- validacoes de formulario
- formatadores e helpers

### Integracao

- hooks de listagem e mutacao
- comportamento de filtros
- importacao e feedback de erro

### E2E prioritario

1. login -> criar evento
2. cadastrar estabelecimento
3. importar frequentadores
4. consultar dashboard
5. consultar transacoes
6. disparar repasse
7. encerrar evento

## Definicao de pronto para comecar a codar

Podemos iniciar a implementacao do painel quando estes itens estiverem minimamente fechados:

1. mapa de rotas do painel
2. matriz de permissoes
3. contratos esperados das APIs do painel
4. decisoes de navegacao e layout
5. prioridade do recorte MVP do painel
