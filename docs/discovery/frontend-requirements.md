# Requisitos de Frontend

## Fonte

Documento de origem:

- `/Users/marcoswiendl/Downloads/TAP_Carteira_Digital_Eventos.docx`

Este arquivo resume apenas os requisitos e restricoes que impactam diretamente o frontend.

## Escopo do time

O time atual e responsavel por:

- painel do organizador;
- app do frequentador;
- app do estabelecimento (PDV);
- documentacao e arquitetura de frontend;
- definicao de contratos esperados para integracao com backend.

Fora do escopo atual:

- implementacao do backend;
- banco de dados;
- operacao financeira;
- infraestrutura de producao.

## 1. Superficies de produto

### 1.1. Painel do organizador

Objetivos principais:

- configurar organizador e evento;
- cadastrar estabelecimentos;
- importar frequentadores;
- acompanhar operacao;
- consultar transacoes;
- iniciar e acompanhar repasses;
- fechar evento.

Requisitos funcionais relacionados:

- RF-01 a RF-15

Principais implicacoes para frontend:

- formularios administrativos;
- tabelas com filtros;
- dashboards em tempo real;
- controle por perfis;
- exportacao de relatorios;
- feedback operacional e rastreabilidade.

### 1.2. App do frequentador

Objetivos principais:

- acessar rapido por magic link;
- definir PIN;
- consultar saldo e historico;
- recarregar por PIX;
- gerar QR de pagamento;
- resgatar saldo residual quando aplicavel.

Requisitos funcionais relacionados:

- RF-16 a RF-27

Principais implicacoes para frontend:

- onboarding de baixa friccao;
- UX mobile-first;
- sincronizacao de saldo;
- fluxo sensivel de PIN;
- estados claros para recarga e expiracao de QR.

### 1.3. PDV

Objetivos principais:

- autenticar operador;
- ler QR via camera;
- validar QR localmente;
- registrar venda online ou offline;
- sincronizar depois;
- acompanhar totalizador e fechamento de turno.

Requisitos funcionais relacionados:

- RF-28 a RF-37

Principais implicacoes para frontend:

- operacao por toque rapido;
- feedback visual e sonoro;
- modo offline-first;
- fila local;
- visibilidade de conectividade e sincronizacao.

## 2. Requisitos funcionais relevantes por grupo

### 2.1. Painel do organizador

- RF-01: cadastro de organizador.
- RF-02: configuracao de credenciais Confrapag com validacao imediata.
- RF-03: criacao de evento com politicas operacionais.
- RF-04: cadastro de estabelecimentos e operadores.
- RF-05: importacao de frequentadores por CSV.
- RF-06: cadastro de frequentadores via webhook externo.
- RF-07: dashboard em tempo real do evento.
- RF-08: consulta detalhada de transacoes com filtros.
- RF-09: exportacao de relatorios CSV/PDF.
- RF-10: disparo manual ou agendado de repasse PIX.
- RF-11: exibicao de status do repasse.
- RF-12: reenvio manual de repasse falho.
- RF-13: configuracao da politica de saldo residual.
- RF-14: multiplos usuarios com perfis.
- RF-15: encerramento formal do evento.

### 2.2. App do frequentador

- RF-16: recebimento de magic link por e-mail.
- RF-17: autenticacao por magic link e definicao de PIN.
- RF-18: exibicao da carteira e saldo atual.
- RF-19: solicitacao de recarga via PIX.
- RF-20: atualizacao automatica do saldo.
- RF-21: lista de estabelecimentos do evento.
- RF-22: geracao de QR de pagamento assinado e de validade curta.
- RF-23: exigencia de PIN para gerar QR.
- RF-24: historico de consumo.
- RF-25: solicitacao de resgate de saldo residual.
- RF-26: bloqueio de operacao com saldo insuficiente.
- RF-27: consistencia entre multiplos dispositivos.

### 2.3. PDV

- RF-28: autenticacao do operador.
- RF-29: leitura de QR via camera.
- RF-30: validacao local da assinatura e validade do QR.
- RF-31: informacao do valor da venda e confirmacao da transacao.
- RF-32: registro local offline e sincronizacao posterior.
- RF-33: protecao contra reuso de QR.
- RF-34: totalizador do dia.
- RF-35: fechamento de turno ou dia com exportacao local.
- RF-36: alertas de QR expirado, invalido ou reutilizado.
- RF-37: indicacao de conectividade e status de sincronizacao.

## 3. Requisitos nao funcionais que impactam o frontend

### Performance

- RNF-01: leitura de saldo em ate 300ms no p95.
- RNF-02: atualizacao de saldo apos PIX em ate 10s no p95.
- RNF-03: validacao local de QR no PDV em ate 500ms.
- RNF-04: suportar picos de 10.000 requisicoes por minuto.

### Disponibilidade e confiabilidade

- RNF-05: SLA alvo de 99,5% mensal e 99,9% em janelas de evento.
- RNF-06: falha do gateway nao deve interromper consumo do evento.
- RNF-07: procedimentos de recuperacao precisam estar documentados.

### Seguranca

- RNF-09: trafego cifrado com TLS 1.2+.
- RNF-12: MFA no painel do organizador.
- RNF-14: QR com assinatura e validade maxima de 5 minutos.
- RNF-15: rate limiting por IP, usuario e organizador.
- RNF-16: resistencia aos principais vetores OWASP.
- RNF-17: logs sem dados sensiveis.

### Privacidade

- RNF-18: aderencia a LGPD.
- RNF-20: exportacao e exclusao de dados pessoais.
- RNF-21: clareza de responsabilidade nos termos.
- RNF-22: consentimento explicito no primeiro acesso.

### Usabilidade

- RNF-26: primeiro acesso do frequentador em menos de 90 segundos.
- RNF-27: PDV operavel com luvas, sol e ruido.
- RNF-28: responsivo a partir de 320px.
- RNF-29: Portugues Brasil no MVP.

### Observabilidade e manutencao

- RNF-30: logs estruturados com tenant, evento e correlation ID.
- RNF-31: metricas operacionais.
- RNF-32: alertas para falhas criticas.
- RNF-34: padroes de qualidade e testes automatizados.
- RNF-35: isolamento da integracao do gateway por interface.
- RNF-36: documentacao tecnica mantida atualizada.

## 4. Restricoes do frontend

- PWA e a estrategia oficial do MVP para experiencias moveis.
- O idioma do MVP e apenas Portugues Brasil.
- O meio de pagamento no MVP e apenas PIX.
- O frontend deve funcionar com conectividade instavel em ambiente de evento, especialmente no PDV.

## 5. Riscos com impacto direto no frontend

- R-01: indisponibilidade do gateway durante o evento.
- R-02: conectividade ruim no local.
- R-03: fraude de double-spend em modo offline.
- R-06: pico de carga na entrada do evento.
- R-07: vazamento de credenciais.
- R-08: baixa adocao do frequentador.
- R-09: frustracao com saldo residual.

## 6. Prioridade de descoberta para o time de frontend

### P0

- jornadas do frequentador do primeiro acesso ao pagamento;
- arquitetura offline do PDV;
- navegacao e permissao do painel do organizador;
- contratos de autenticacao e sessao;
- estrategia de estados e sincronizacao.

### P1

- dashboards e relatorios;
- fluxo de resgate de saldo residual;
- exportacoes e operacao de fechamento;
- instrumentacao de analytics e observabilidade.

### P2

- refinamento de branding;
- microcopy;
- acessibilidade aprofundada por contexto;
- otimizacoes de experiencia pos-MVP.
