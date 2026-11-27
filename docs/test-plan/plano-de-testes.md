# Plano de Testes — StockFlow

**Unidade curricular:** Garantia e Qualidade de Software (GQS) — UNISUL
**Projeto:** StockFlow — Sistema de Gestão de Estoque
**Versão de referência do repositório recebido:** commit `408edc6` (`main`)
**Data da última evidência local fornecida:** 27/11/2026

## 1. Objetivo

Este plano define como verificar a qualidade do StockFlow, registrar defeitos,
medir cobertura, executar análise estática e produzir evidências reproduzíveis
para a A3. Os objetivos são:

- verificar requisitos funcionais e regras de negócio;
- validar a integração entre interface, API, Prisma e PostgreSQL;
- prevenir regressões durante a evolução do projeto;
- verificar integridade transacional e controle de acesso;
- automatizar typecheck, build, testes e análise estática no GitHub Actions;
- avaliar desempenho e usabilidade com evidências próprias, sem inferi-los a
  partir de testes funcionais.

### Contexto de “sistema legado”

O enunciado da A3 utiliza a expressão “sistema legado”. O StockFlow, porém, foi
criado como projeto acadêmico para a própria A3; não há histórico documentado
de operação em produção ou de manutenção de uma versão antiga. O plano trata a
implementação existente como uma base parcialmente construída que precisa ser
preservada e testada durante a evolução. A interpretação acadêmica do termo
deve ser confirmada com o professor, sem inventar histórico de produção.

## 2. Escopo dos testes

### 2.1 Dentro do escopo implementado

**Backend e banco de dados:**

- health check (`GET /health`);
- autenticação, logout, sessão atual e preferência de idioma;
- cadastro, listagem, consulta, edição e desativação de produtos;
- operações de categorias e fornecedores;
- gerenciamento de usuários e autorização por perfil;
- entrada e saída de estoque por `StockMovement`;
- consulta do histórico de movimentações;
- dashboard com totais, categorias e movimentações recentes;
- validação de entrada, tratamento de erros, CORS e headers de segurança;
- persistência PostgreSQL por Prisma, schema e migrations;
- integridade do estoque, incluindo saída concorrente e rejeição de saldo
  insuficiente.

**Frontend:**

- typecheck, build e testes unitários existentes;
- internacionalização `en`/`pt-BR`;
- comportamento visual de tema claro/escuro, validado manualmente pelo
  desenvolvedor;
- fluxos de login, dashboard, inventário, categorias, movimentações,
  fornecedores, usuários e configurações ainda precisam de testes de interface
  automatizados mais amplos.

**Qualidade e automação:**

- cobertura Vitest com limite configurado de 75% em statements, branches,
  functions e lines;
- GitHub Actions para validações do backend e frontend;
- SonarQube Cloud com importação de LCOV e bloqueio do job quando o Quality Gate
  reprova.

### 2.2 Fora do escopo implementado ou ainda pendente

- módulo funcional de relatórios: a rota/tela `/reports` é somente placeholder;
- testes de carga, estresse e escalabilidade efetivamente executados;
- validação formal de usabilidade com participantes;
- testes end-to-end em navegador cobrindo todos os fluxos do frontend;
- análise SonarCloud do frontend no mesmo projeto: foi avaliada, mas a inclusão
  fica pendente até que exista uma estratégia e relatório de cobertura frontend
  adequados; o CI frontend é verificado em job independente;
- implantação e monitoramento de produção.

## 3. Contexto técnico e arquitetura

O StockFlow é uma aplicação web com frontend React/Vite, API Node.js/Express e
PostgreSQL gerenciado por Prisma. O backend utiliza camadas de routes,
controllers, services e repositories, além de middlewares e validação Zod. O
frontend separa componentes de layout/UI, funcionalidades e bibliotecas
compartilhadas.

Tecnologias principais:

- Node.js 24 e TypeScript;
- React 19 e Vite 8;
- Express 5;
- PostgreSQL 16 e Prisma 7;
- Zod 4;
- Vitest 5 e Supertest;
- k6 para os cenários de carga planejados;
- GitHub Actions para integração contínua;
- SonarQube Cloud para análise estática.

### 3.1 Modelo relacional

O schema Prisma possui seis modelos:

| Modelo | Responsabilidade |
|---|---|
| `User` | Identidade de usuário/funcionário, perfil, email, hash de senha, idioma e situação |
| `Session` | Sessão autenticada, hash do token, expiração e revogação |
| `Category` | Classificação de produtos |
| `Product` | Cadastro, preço, saldo, estoque mínimo, unidade e localização |
| `StockMovement` | Histórico unificado de entradas e saídas |
| `Supplier` | Cadastro de fornecedor e vínculo com movimentações |

Entradas e saídas são diferenciadas por `StockMovementType` (`ENTRY`/`EXIT`),
não por tabelas separadas. `StockMovement` pode relacionar produto, fornecedor,
usuário responsável, custo unitário e destinatário.

### 3.2 Comparação com o tema da A3

| Elemento do tema | Implementação observada | Situação |
|---|---|---|
| Produtos | `Product` possui identificador, nome, categoria, preço, quantidade, SKU, descrição, estoque mínimo, unidade e localização | Implementado |
| Entradas | `StockMovement` com `type=ENTRY`, produto, quantidade, data, fornecedor e custo unitário opcional | Implementado |
| Saídas | `StockMovement` com `type=EXIT`, produto, quantidade, data e destinatário | Implementado |
| Funcionários | Representados por `User`, com nome, perfil/cargo, email/login e senha armazenada como hash | Implementado como usuário; confirmar com o professor se requer tabela `Employee` separada |
| Relatórios | Dashboard contém indicadores e agregações; tela `/reports` permanece placeholder, sem módulo dedicado de relatórios | Parcial / pendente |

A existência de indicadores no dashboard não deve ser apresentada como um
módulo completo de relatórios. Essa distinção deve ser preservada na
apresentação e no relatório acadêmico.

## 4. Estratégia de testes

### 4.1 Testes unitários

Testam services, repositories, controllers, validações e regras isoladas, com
mocks para dependências externas quando adequado. A ampliação inclui cobertura
direta do `auth.repository` e do `dashboard.controller`, acrescentada nesta
revisão e pendente de execução na máquina de desenvolvimento.

### 4.2 Testes de integração

Utilizam Supertest e PostgreSQL real para validar rotas, controllers, services,
repositories, Prisma e persistência. Incluem autenticação, usuários, produtos,
categorias, fornecedores e movimentações.

### 4.3 Testes de sistema

Executam o servidor compilado como processo independente e realizam
requisições HTTP reais. A suíte atual valida health check, cadastro e consulta
de produto, entrada, saída, saldo, rejeição de saída insuficiente, histórico e
saídas concorrentes.

### 4.4 Testes frontend

O frontend possui testes Vitest para `cn` e internacionalização. O CI deve
executar typecheck, testes e build em job próprio. Ainda é necessário ampliar os
testes de componentes e fluxos críticos, preferencialmente com ambiente de
DOM e testes de interação, antes de incorporar sua cobertura ao Quality Gate
SonarCloud do backend.

### 4.5 Testes de regressão

Toda correção deve manter ou ampliar os testes que demonstram seu comportamento.
Após alterações, executar typecheck, build, testes unitários/integração e testes
de sistema do backend, além de typecheck, testes e build do frontend. O workflow
do GitHub Actions deve repetir essas verificações nos pushes e pull requests
para `main`.

### 4.6 Desempenho e escalabilidade

Existem cenários k6 para `GET /products`, `GET /products/:id`, `POST /products`
e `POST /stock-movements` (entrada e saída). A documentação exige banco local
isolado `stockflow_perf`, massa sintética registrada por execução e limpeza
restrita aos IDs da execução. Os testes ainda não foram executados; não há
resultados ou limites de aprovação disponíveis.

Antes da execução, definir com o professor ou registrar como hipótese técnica:

- número de produtos e movimentações em cada volume;
- níveis de VUs e duração de cada etapa;
- quantidade de repetições independentes;
- métricas a registrar: média, p50, p95, p99, requisições por segundo, taxa de
erros e timeouts;
- critérios de aceitação e limitações do ambiente de teste.

O cenário de duas saídas concorrentes comprova integridade para uma situação
específica, não throughput nem capacidade de escalabilidade.

### 4.7 Prototipação e usabilidade

O ZIP não contém link, arquivo ou evidência versionada de protótipo Figma. Isso
não prova que o protótipo não exista fora do repositório; a existência e o link
precisam ser confirmados. Também não há relatório de testes de usabilidade.

A avaliação deve propor tarefas representativas (cadastrar produto, consultar
estoque, registrar entrada, registrar saída e consultar histórico) e registrar
participantes sem dados sensíveis, sucesso/fracasso, tempo, erros, necessidade
de ajuda e comentários. Resultados devem ser documentados, não presumidos.

### 4.8 Segurança

A estratégia cobre autenticação por sessão, Argon2id, armazenamento do hash do
token, cookie HttpOnly, CSRF, CORS, autorização por perfil, rate limit de login,
validações e análise estática. CORS não deve ser descrito como mecanismo de
autenticação.

## 5. Ambiente e dados de teste

O backend requer Node.js 24, npm, PostgreSQL e `DATABASE_URL`; o CI usa
PostgreSQL 16 descartável. O processo padrão inclui `npm ci`, `npx prisma
generate`, `npx prisma migrate deploy`, typecheck, build e testes.

Dados de teste devem ser sintéticos. Os testes de integração/sistema criam e
removem seus próprios registros com identificadores/prefixos controlados. O
arquivo `.env` local e backups de banco não devem ser enviados ao repositório
nem anexados em pacotes de entrega. Os testes k6 devem usar exclusivamente o
banco local isolado `stockflow_perf`, nunca o banco de desenvolvimento ou
produção.

## 6. Ferramentas

| Ferramenta | Uso |
|---|---|
| Vitest | Testes unitários e integração, mocks e cobertura |
| Supertest | Requisições HTTP na suíte de integração |
| `fetch` do Node.js | Testes de sistema contra servidor real |
| Prisma | Acesso ao banco e migrations |
| PostgreSQL | Persistência e testes transacionais |
| k6 | Testes de carga planejados |
| GitHub Actions | CI para backend e frontend |
| SonarQube Cloud | Análise estática, cobertura importada, duplicação e Quality Gate |
| GitHub Issues | Registro e acompanhamento de defeitos e tarefas |

## 7. Evidências de execução disponíveis

Os resultados abaixo são da execução local informada pelo desenvolvedor em
27/11/2026, antes da inclusão dos dois novos arquivos de teste desta revisão:

| Suíte/verificação | Resultado informado |
|---|---:|
| Backend — testes unitários e integração | 250 testes em 28 arquivos, todos aprovados |
| Backend — testes de sistema | 11 testes, todos aprovados |
| Backend — typecheck e build | Aprovados |
| Backend — cobertura global Vitest | 84,24% statements; 79,95% branches; 86,30% functions; 82,82% lines |
| Frontend — testes | 8 testes em 2 arquivos, todos aprovados |
| Frontend — typecheck e build | Aprovados |

Nesta revisão foram adicionados 18 casos em três arquivos: nove de
`auth.repository`, um de `dashboard.controller` e oito para os helpers de
segurança dos scripts de desempenho. Também foi alterada a configuração de
cobertura e reorganizada a classificação de fontes/testes do Sonar. Esses
acréscimos ainda precisam ser executados localmente e no CI; os resultados
anteriores não devem ser apresentados como validação dessas alterações.

### 7.1 SonarQube Cloud — evidência do commit `408edc6`

A análise do commit `408edc6` falhou no Quality Gate por duas condições de
código novo:

| Condição | Resultado da análise | Limite exigido | Situação |
|---|---:|---:|---|
| Cobertura de código novo | 71,71% | pelo menos 80% | Reprovada |
| Linhas duplicadas de código novo | 4,27% | no máximo 3% | Reprovada |

O painel indicava zero novos issues e zero accepted issues. O log do workflow
mostra que o scanner enviou o relatório, aguardou o processamento e encerrou
com `QUALITY GATE STATUS: FAILED` e exit code 3. Isso comprova que o bloqueio do
Quality Gate está conectado ao job do CI e que uma reprovação faz o workflow
falhar.

A nova configuração local do scanner:

- define `src` como fonte de produção;
- classifica `src/**/*.test.ts` e `performance/**` como testes;
- exclui Prisma gerado da análise de fontes;
- exclui scripts operacionais, utilitários de teste e declarações de tipos apenas
da métrica de cobertura, mantendo-os disponíveis para análise estática quando
aplicável;
- preserva o LCOV produzido pelo Vitest.

A classificação das pastas `performance/` como testes é coerente com sua função:
são cenários k6 e scripts de preparação/limpeza, não código executado no fluxo
normal da aplicação. A duplicação dentro desses cenários deve ser reduzida por
helpers compartilhados, não por exclusão arbitrária de código de produção.

O frontend ganhou um job CI independente de typecheck, testes e build. Sua
inclusão na análise Sonar do mesmo Quality Gate foi adiada até que tenha
instrumentação LCOV e cobertura de interface adequada; não se deve apresentar
a cobertura do backend como cobertura de todo o projeto.

**Status documental:** o Quality Gate ainda não está aprovado. É necessário
fazer push das alterações, aguardar nova análise e registrar a captura/link do
resultado final.

## 8. Critérios de aceitação

Para a parte de qualidade de software, verificar:

- cobertura mínima de 75% em statements, branches, functions e lines na suíte
  configurada do backend;
- Quality Gate do SonarCloud aprovado, com evidência da execução final;
- análise e tratamento dos issues de segurança, confiabilidade e
  manutenibilidade apresentados pelo Sonar;
- typecheck, build, testes unitários/integração e testes de sistema aprovados;
- CI reproduzível no GitHub Actions, incluindo o job frontend;
- relatório de testes com resultados, limitações, defeitos encontrados e
  evidências.

A cobertura Vitest (gerada por execução de testes) e a cobertura de código novo
SonarCloud são métricas distintas e devem ser registradas separadamente.

## 9. Gestão de defeitos

1. Registrar a falha, ambiente, passos para reprodução e evidência.
2. Abrir ou atualizar GitHub Issue com comportamento esperado e observado.
3. Priorizar pelo impacto em segurança, integridade, confiabilidade e uso.
4. Corrigir sem remover o teste que revelou o problema.
5. Reexecutar os testes afetados, regressão, typecheck e build.
6. Fechar a Issue somente após validação e vincular commit/PR quando aplicável.

## 10. Cronograma e entregáveis

O trabalho restante para GQS deve incluir: nova execução de CI/Sonar com Quality
Gate aprovado; execução dos testes de desempenho conforme critérios definidos;
avaliação de usabilidade se exigida no enunciado; atualização das Issues;
consolidação do relatório de testes e evidências; apresentação com demonstração
funcional.

As datas informadas pelo professor para a entrega atualizada são:

- **02/12/2026:** upload no Ulife por cada integrante;
- **02/12 e 03/12/2026:** apresentações da ExpoTechArq A3; cada integrante deve
  comparecer no dia de sua apresentação e permanecer no período indicado pelo
  professor (19h–21h50).

Essas datas devem ser reconfirmadas no Ulife/avisos oficiais antes do envio.

## 11. Controle de versão

Repositório: [Gabriel-c-l/stockflow](https://github.com/Gabriel-c-l/stockflow).
Branch principal: `main`.

A estrutura relevante inclui `backend/src`, `backend/prisma`,
`backend/performance`, `frontend/src`, `frontend/tests`, `docs/modelagem`,
`docs/requisitos.md` e `.github/workflows/ci.yml`. As convenções de commit
observadas incluem `feat:`, `test:`, `fix:`, `security:` e `ci:`.
