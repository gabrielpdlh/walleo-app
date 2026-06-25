# Padroes de Codigo

## Objetivo

Estabelecer padroes de qualidade para o frontend desde o inicio, alinhados a SOLID, clean code e evolucao sustentavel do repositorio.

## 1. Principios gerais

1. Cada modulo deve ter uma responsabilidade clara.
2. Componentes visuais devem conhecer apresentacao, nao regras de negocio.
3. Regras de negocio nao devem depender de framework de UI.
4. Integracoes externas devem entrar por adaptadores.
5. Tipos e contratos devem ser explicitos.
6. Nomes devem comunicar intencao, nao implementacao acidental.

## 2. SOLID aplicado ao frontend

### Single Responsibility

- um componente resolve uma preocupacao principal;
- um hook representa um caso de uso ou fonte de dados;
- um client de API atende um bounded context, nao o sistema inteiro.

### Open/Closed

- fluxos novos devem surgir por composicao e extensao de modulos;
- evitar `switch` central gigante para tratar toda a aplicacao.

### Liskov Substitution

- componentes que compartilham interface devem respeitar o mesmo contrato de uso;
- variantes de UI nao devem quebrar expectativas basicas de acessibilidade e comportamento.

### Interface Segregation

- preferir props e contratos pequenos;
- nao expor dependencias desnecessarias aos consumidores.

### Dependency Inversion

- presentation depende de interfaces e casos de uso;
- `fetch`, storage e camera devem entrar via adapters;
- regras importantes nao devem depender diretamente de bibliotecas de terceiro.

## 3. Clean code

### Regras de organizacao

- arquivos pequenos e com objetivo claro;
- funcoes curtas, com poucos argumentos;
- evitar booleanos obscuros em assinaturas;
- usar enums ou unions para estados significativos;
- comentarios apenas quando a intencao nao puder ser expressa no codigo.

### Nomenclatura

- componentes: `PascalCase`
- hooks: `useX`
- helpers puros: verbos ou transformacoes claras
- schemas Zod: `somethingSchema`
- mapeadores: `toDomainX`, `toViewModelX`

## 4. Limites de camada

### Presentation nao pode

- chamar `fetch` diretamente;
- montar payloads crus;
- aplicar regra de negocio critica;
- conhecer detalhes de storage local do PDV.

### Infrastructure nao pode

- tomar decisoes de negocio;
- construir mensagens finais da interface.

### Domain nao pode

- importar React;
- importar Next.js;
- depender de API remota, browser APIs ou IndexedDB.

## 5. Padroes de componentes

- components compartilhados devem ser controlados por composicao;
- componentes de pagina montam secoes, nao fazem toda a logica;
- listas, tabelas e formularios complexos devem ser quebrados por feature;
- estados de carregamento, erro e vazio devem ser padronizados.

## 6. Formularios

- usar schema para validar antes de enviar;
- centralizar transformacoes de entrada;
- separar validacao de interface da validacao de dominio quando necessario;
- mensagens de erro devem ser objetivas e em Portugues Brasil.

## 7. Dados e contratos

- toda resposta externa deve ser parseada;
- nunca confiar em payload sem validacao;
- nunca espalhar strings de endpoint pelo app;
- erros de API devem ser normalizados antes de chegar a UI.

## 8. Offline e sincronizacao

No PDV:

- a fila local e um modulo de infraestrutura;
- reconciliacao e reenvio sao casos de uso;
- componentes de tela apenas representam status e disparam acoes.

## 9. Testabilidade

- toda regra importante deve ser testavel sem browser completo;
- mocks devem entrar pelas interfaces;
- factories de teste devem evitar fixtures gigantes e opacas;
- jornadas criticas precisam de E2E.

## 10. Governanca minima

Antes de merge:

- `npm run lint`
- `npm run typecheck`
- testes da area alterada
- atualizacao da documentacao afetada quando houver mudanca de arquitetura, fluxo ou contrato
