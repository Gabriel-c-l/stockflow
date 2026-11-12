# Plano de Testes — StockFlow

## 2.1 Objetivo do plano de testes

Este plano define a abordagem para verificar a qualidade do StockFlow, projeto
acadêmico desenvolvido para a Unidade Curricular de Garantia e Qualidade de
Software da UNISUL. Seus objetivos são:

- verificar se os endpoints implementados atendem aos requisitos funcionais;
- validar as regras de negócio relacionadas ao cadastro de produtos e às
  movimentações de estoque;
- avaliar a integração entre a API, o Prisma e o PostgreSQL;
- verificar o comportamento do sistema executado como uma aplicação completa;
- detectar regressões durante a evolução do projeto;
- produzir evidências reproduzíveis por meio de testes automatizados, cobertura
  de código e integração contínua.

O documento da A3 utiliza a expressão “sistema legado”. Essa caracterização não
corresponde ao histórico real do StockFlow: o projeto foi criado para esta A3 e
está em desenvolvimento, sem registro de uma versão anterior em produção ou de
manutenções históricas. Ainda assim, o plano contempla a necessidade de testar
um sistema já parcialmente implementado, com componentes e decisões técnicas
existentes que precisam ser preservados durante a evolução. A interpretação
acadêmica da expressão “sistema legado” deve ser esclarecida com o professor
antes da entrega final.

## 2.2 Escopo do teste

### Dentro do escopo

Serão testados os componentes e fluxos atualmente implementados no backend:

- endpoint `GET /health`;
- cadastro de produtos por `POST /products`;
- listagem por `GET /products`;
- consulta por `GET /products/:id`;
- registro de entradas e saídas por `POST /stock-movements`;
- consulta do histórico por `GET /products/:id/movements`;
- validações de entrada realizadas com Zod;
- regras de SKU único, campos obrigatórios e `minStock` não negativo;
- regras de quantidade positiva, tipos `ENTRY` e `EXIT` e estoque não negativo;
- atualização do saldo e preservação do histórico;
- transação entre atualização do produto e registro da movimentação;
- configuração de CORS e ausência do cabeçalho `X-Powered-By`;
- integração da aplicação com PostgreSQL por meio do Prisma 7;
- geração do Prisma Client e aplicação das migrations no ambiente de CI;
- execução automatizada no GitHub Actions e análise estática pelo SonarQube
  Cloud.
- avaliação planejada de desempenho e escalabilidade dos endpoints principais;
- avaliação planejada de usabilidade baseada em protótipos e telas, quando esses
  artefatos estiverem disponíveis.

Os testes estão organizados em três níveis: 11 testes unitários, 23 testes de
integração e 10 testes de sistema (E2E), totalizando 44 testes. Os testes
unitários isolam services, schemas e repositories por meio de mocks. Os testes
de integração exercitam a API com Supertest e persistência real. Os testes de
sistema iniciam o servidor compilado como processo independente e realizam
requisições HTTP reais.

### Fora do escopo

Não serão testados nesta versão:

- funcionalidades planejadas, mas ainda não implementadas, como relatórios,
  monitoramento de estoque baixo e gerenciamento de funcionários;
- frontend, sua interface e sua integração visual com a API;
- autenticação e autorização, pois não fazem parte da implementação atual;
- categorias, fornecedores e outras entidades não presentes no modelo atual;
- movimentações além dos tipos `ENTRY` e `EXIT`;
- carga, estresse e benchmarking formal;
- desempenho, escalabilidade e usabilidade ainda não avaliados formalmente;
- implantação em produção e infraestrutura externa ao ambiente de CI.

Esses itens ficam fora do escopo porque não existem como funcionalidades
implementadas ou porque exigiriam requisitos e ambientes que não estão
documentados no repositório atual. Desempenho e usabilidade permanecem como
atividades pendentes da A3, e não como requisitos descartados.

## 2.3 Contexto do sistema

O StockFlow é uma API de gerenciamento de estoque em desenvolvimento. A
implementação atual oferece cadastro e consulta de produtos, entrada e saída de
estoque e histórico de movimentações. A aplicação utiliza uma arquitetura
backend organizada em rotas, controllers, services, repositories e types.

### Arquitetura e tecnologias

- Node.js 24 como runtime;
- TypeScript com verificação estrita;
- Express 5 para a API HTTP;
- PostgreSQL 16 como banco de dados;
- Prisma 7 como ORM e gerador de client;
- adapter PostgreSQL do Prisma para conexão com o banco;
- Zod para validação dos dados recebidos;
- dotenv para configuração por variáveis de ambiente;
- Vitest para execução dos testes;
- Supertest nos testes de integração;
- `fetch` nos testes de sistema, contra o servidor compilado;
- GitHub Actions para integração contínua;
- SonarQube Cloud para análise estática e qualidade.

O modelo atual contém `Product` e `StockMovement`. A atualização do saldo e o
registro da movimentação são realizados em uma transação do banco de dados. As
migrations do Prisma estão em `backend/prisma/migrations`.

### Comparação com o modelo de dados da A3

O documento específico do tema apresenta as entidades e atributos abaixo. A
comparação com o schema Prisma efetivamente implementado é:

| Requisito da A3 | Situação no StockFlow | Observação |
|---|---|---|
| Produtos: ID, nome, categoria, preço e quantidade | Parcialmente contemplado | `Product` possui `id`, `name` e `quantity`, além de `sku`, `description`, `minStock`, `isActive`, `createdAt` e `updatedAt`. Não possui `categoria` nem `preço`. |
| Entradas: ID, produto, quantidade, data e fornecedor | Parcialmente contemplado | `StockMovement` representa uma entrada com `id`, `productId`, `quantity`, `createdAt` e `type=ENTRY`. Não possui fornecedor; o campo de data implementado é `createdAt`. |
| Saídas: ID, produto, quantidade, data e destinatário | Parcialmente contemplado | `StockMovement` representa uma saída com `id`, `productId`, `quantity`, `createdAt` e `type=EXIT`. Não possui destinatário; o campo de data implementado é `createdAt`. |
| Funcionários: ID, nome, cargo, login e senha | Não implementado | Não existe entidade, tabela, endpoint ou regra correspondente. |
| Relatórios: ID, tipo, data e detalhes | Não implementado | Não existe entidade, tabela, endpoint ou geração de relatórios. |

Assim, os requisitos de produto, entrada e saída estão somente parcialmente
contemplados. O escopo de testes atual cobre a implementação real de produtos e
movimentações, mas não pode declarar atendidos categoria, preço, fornecedor,
destinatário, funcionários ou relatórios. Essa diferença reduz o escopo
funcional atualmente verificável e deve ser apresentada na A3 como limitação do
estado implementado; a inclusão dos itens ausentes depende de requisitos,
modelagem e implementação futuras.

### Histórico e documentação disponível

O repositório não contém um histórico formal de manutenção de um sistema legado.
O README e o README em português identificam o projeto como acadêmico e em
desenvolvimento, além de registrarem objetivos, funcionalidades planejadas e
tecnologias previstas. A documentação inicialmente existente em
`docs/test-plan` não continha um plano preenchido.

Há uma diferença entre a documentação inicial e a implementação atual: os
READMEs ainda descrevem o backend como planejado em Go, enquanto o backend
implementado utiliza Node.js e TypeScript. Este plano considera a implementação
real verificada no código e registra a necessidade de atualizar essa
documentação de referência em uma etapa posterior.

Na ausência de histórico detalhado, decisões e comportamentos são inferidos
somente a partir do código, do schema Prisma, das migrations, dos testes e do
workflow de CI. Requisitos futuros ou interpretações não documentadas devem
ser confirmados antes de serem transformados em casos de teste.

O repositório não contém arquivo `.fig`, link de arquivo Figma, imagens de
telas ou outra especificação visual versionada. Os READMEs apenas mencionam
Figma na lista de ferramentas. Essa ausência no repositório não permite concluir
que materiais visuais não tenham sido produzidos fora dele. Os artefatos visuais
precisam ser disponibilizados e versionados para que possam ser usados como
oráculo de teste, e a existência de um protótipo navegável no Figma precisa ser
confirmada.

## 2.4 Estratégia de testes

### Testes unitários

Os testes unitários verificam componentes isolados, sem conexão com PostgreSQL e
sem executar consultas Prisma reais. Os repositories e o cliente transacional
são mockados. São cobertas, entre outras, as regras de duplicidade de SKU,
produto inexistente, entrada, saída, estoque insuficiente e validações de
quantidade.

### Testes de integração

Os testes de integração utilizam Supertest para chamar a API e PostgreSQL real
para persistir e consultar dados. Eles verificam o comportamento conjunto entre
rotas, controllers, services, repositories, Prisma e banco de dados. A suíte
inclui os fluxos de produtos, movimentações, histórico, validações HTTP, CORS e
headers de segurança.

### Testes de sistema

Os testes de sistema iniciam `dist/server.js` como processo filho
independente, identificam uma porta disponível, aguardam o endpoint `/health` e
fazem requisições HTTP reais com `fetch`. A suíte valida o fluxo completo de
cadastro, consulta, listagem, entrada, saída, saldo, estoque insuficiente,
consistência e histórico. Os registros criados pela própria suíte são
removidos ao final.

### Testes de regressão

Os testes de regressão são necessários porque novas alterações podem afetar
produtos, movimentações, persistência, validações ou endpoints existentes. A
suíte unitária e de integração é executada por `npm test`, e os testes de
sistema por `npm run test:system`. O workflow do GitHub Actions executa
typecheck, build, testes com cobertura e testes de sistema em cada push ou pull
request para `main`.

### Desempenho

Desempenho e escalabilidade são requisitos não funcionais prioritários da A3.
Ainda não foram executados testes formais de desempenho, e não há resultados,
metas ou métricas alcançadas a declarar. A avaliação planejada deverá medir,
em ambiente controlado, o tempo de resposta dos endpoints principais de
cadastro de produto (`POST /products`), consulta (`GET /products/:id`) e
movimentação (`POST /stock-movements`). A consulta de listagem e o histórico
também podem ser incluídos para observar o efeito do volume de registros.

A estratégia deverá registrar, para cada cenário e carga definida, pelo menos
os tempos de resposta observados e a quantidade de requisições concluídas,
comparando execuções com diferentes volumes de dados. A análise de
escalabilidade deverá observar a variação do comportamento quando aumentarem
os produtos, as movimentações e a concorrência. Não serão atribuídos valores
de referência antes de serem definidos os critérios da A3 e executada a
medição.

Para realizar essa avaliação ainda faltam: definir cargas e perfis de uso,
estabelecer métricas e critérios de aceitação com o professor, preparar uma
massa de dados representativa, escolher uma ferramenta de carga e executar os
ensaios em ambiente controlado. Os testes funcionais atuais não substituem
essa avaliação.

### Prototipação e usabilidade

A prototipação e a usabilidade são relevantes para o tema da A3, mas não há
evidência de protótipos ou telas versionados no repositório analisado. A menção
a Figma nos READMEs registra a ferramenta, mas não comprova a existência,
aprovação ou disponibilidade de materiais produzidos fora do repositório.
Também precisa ser confirmada a existência de um protótipo navegável no Figma.
Não há evidência documentada de que testes de usabilidade tenham sido
realizados.

Quando o protótipo e as telas forem disponibilizados e versionados, a
estratégia deverá definir tarefas representativas, como cadastrar um produto,
consultar um produto, registrar uma entrada, registrar uma saída e consultar o
histórico.
Deverão ser observados sucesso da tarefa, erros cometidos, necessidade de
ajuda, clareza dos rótulos e percepção dos participantes. Os resultados
deverão ser registrados sem inferir conclusões a partir dos testes de API.
Até essa disponibilização, prototipação, seleção de participantes, roteiro e
execução da avaliação de usabilidade permanecem pendentes.

### Segurança

Segurança é aplicável ao escopo atual. São verificadas a rejeição de origens
não autorizadas pelo CORS, a permissão controlada de origens configuradas, o
funcionamento de requisições sem `Origin` e a remoção do cabeçalho
`X-Powered-By`. O SonarQube Cloud complementa os testes com análise estática.
Não estão cobertos autenticação, autorização ou testes de infraestrutura, pois
essas funcionalidades não existem no sistema atual.

### Falta de documentação ou conhecimento

Como o projeto foi criado para esta A3 e sua documentação ainda está em
construção, a estratégia é:

1. usar o código, o schema, as migrations e os testes como fontes primárias;
2. registrar explicitamente suposições e limites de escopo;
3. evitar classificar como requisito qualquer comportamento não demonstrado;
4. confirmar com o professor a interpretação de “sistema legado”;
5. revisar o plano quando novos requisitos ou módulos forem definidos.

## 2.5 Ambiente de teste

### Ambiente de execução

O backend é executado com Node.js 24, TypeScript compilado para `dist` e
PostgreSQL 16. Os testes unitários não requerem banco. Os testes de integração
e de sistema requerem PostgreSQL acessível pela variável `DATABASE_URL`.

No CI, o GitHub Actions executa em `ubuntu-latest` e inicializa um serviço
PostgreSQL 16 com banco e credenciais descartáveis exclusivos da execução. O
workflow aplica as migrations antes dos testes. Nenhuma credencial real ou dado
de produção é utilizado pelo ambiente de teste.

### Requisitos de software

- Node.js 24;
- npm e o `package-lock.json` correspondente;
- PostgreSQL 16;
- dependências instaladas com `npm ci`;
- Prisma Client gerado com `npx prisma generate`;
- migrations aplicadas com `npx prisma migrate deploy`;
- variáveis `DATABASE_URL`, `PORT` e `CORS_ORIGINS` conforme o cenário;
- sistema capaz de executar processos filhos para os testes E2E.

Não há especificação de hardware mínimo no repositório. Portanto, este plano
não estabelece CPU, memória ou armazenamento não documentados. O ambiente
replicável é definido pelas versões de software, pelo lockfile, pelo workflow e
pelas migrations.

### Estratégia de replicação

Para reproduzir o ambiente:

1. instalar Node.js 24;
2. executar `npm ci` em `backend`;
3. configurar um PostgreSQL 16 de testes;
4. definir `DATABASE_URL` sem utilizar dados de produção;
5. executar `npx prisma generate`;
6. executar `npx prisma migrate deploy`;
7. executar `npm run typecheck`, `npm run build`, `npm test` e
   `npm run test:system`.

## 2.6 Dados de teste

Os dados são gerados pelos próprios testes. Produtos de integração utilizam
prefixos como `TEST-PRODUCT-` e `TEST-MOVEMENT-`; os testes de sistema geram
identificadores exclusivos por execução. Os dados unitários são objetos em
memória e não são persistidos.

Os dados representam os fluxos funcionais implementados: produtos válidos,
entradas, saídas, estoque suficiente e insuficiente, histórico, duplicidade,
campos inválidos e produtos inexistentes. A representatividade é limitada ao
escopo atual, pois não há requisitos documentados para volumes de produção,
perfis de usuários ou massas históricas.

Os testes não devem utilizar dados pessoais, credenciais reais ou dados
confidenciais. O CI utiliza credenciais descartáveis para o PostgreSQL, e o
arquivo `.env` local não deve ser exposto. A limpeza é restrita aos registros
criados pela suíte: os testes de integração removem dados identificados por
prefixos próprios, e os testes de sistema removem o produto identificado pelo
SKU exclusivo e suas movimentações.

## 2.7 Ferramentas de teste

| Ferramenta | Utilização | Justificativa |
|---|---|---|
| Vitest | Execução dos testes unitários e de integração, com configuração TypeScript | Integra-se ao projeto TypeScript e permite mocks, execução seletiva e relatórios de cobertura. |
| Supertest | Requisições HTTP nos testes de integração | Permite validar rotas e middleware junto da aplicação Express sem iniciar um processo externo. |
| `fetch` nativo do Node.js | Requisições nos testes de sistema | Garante HTTP real contra o servidor compilado em processo independente, distinguindo E2E de integração. |
| Prisma 7 | Persistência e acesso ao PostgreSQL nos testes de integração e sistema | Exercita o mesmo caminho de persistência utilizado pela aplicação. |
| PostgreSQL 16 | Banco de dados de teste | Reproduz o mecanismo de banco definido para o sistema e para as migrations. |
| GitHub Actions | Automação da execução em push e pull request para `main` | Padroniza o ambiente, executa as etapas de qualidade e impede que falhas avancem no pipeline. |
| SonarQube Cloud | Análise estática e verificação de qualidade | Complementa os testes dinâmicos com análise de código, cobertura LCOV e detecção de problemas de qualidade e segurança. |
| npm e `package-lock.json` | Instalação reprodutível e execução dos scripts | Mantêm as dependências e os comandos consistentes entre desenvolvimento e CI. |
| GitHub | Gestão do código e integração das verificações no fluxo de pull requests | Permite versionamento, revisão e acompanhamento das execuções automatizadas. |

As ferramentas de gestão de casos, defeitos e monitoramento não estão
formalmente configuradas no repositório analisado. Issues, pull requests e os
logs do GitHub Actions são os mecanismos atualmente identificáveis. A escolha
de uma ferramenta dedicada para gestão de casos ou defeitos deve ser confirmada
para a entrega acadêmica.

## 2.8 Cronograma

O cronograma abaixo organiza as fases de teste com estimativas de esforço.
Essas estimativas não possuem datas de execução confirmadas e devem ser
ajustadas conforme a disponibilidade do aluno e a definição dos requisitos
pendentes.

| Fase | Atividades | Estimativa | Dependências e marcos |
|---|---|---:|---|
| Planejamento | Revisar requisitos da A3, escopo, riscos e critérios de aceitação | 1 dia | Depende da confirmação do escopo pelo professor; marco: plano revisado |
| Preparação | Configurar Node.js, dependências, Prisma, PostgreSQL e ambiente de CI | 1 dia | Depende do ambiente de execução; marco: migrations aplicadas |
| Testes unitários | Executar e revisar os testes isolados de services e schemas | 1 dia | Depende da implementação dos módulos; marco: 11 testes unitários executáveis |
| Testes de integração | Executar API, Prisma e PostgreSQL em conjunto | 1 dia | Depende do banco de teste e das migrations; marco: 23 testes de integração executáveis |
| Testes de sistema | Compilar a aplicação, iniciar o processo real e executar fluxos HTTP E2E | 1 dia | Depende de build, PostgreSQL e porta disponível; marco: 10 testes de sistema executáveis |
| Cobertura e qualidade | Gerar LCOV, verificar limiar de 75% e executar análise SonarQube | 1 dia | Depende da suíte completa e do secret `SONAR_TOKEN`; marco: análise disponível |
| Desempenho | Definir cargas, preparar massa de dados e medir endpoints principais | A definir | Depende de critérios de aceitação e ferramenta de carga; atividade ainda não executada |
| Usabilidade | Disponibilizar protótipo Figma, definir tarefas e executar avaliação | A definir | Depende de protótipos e participantes; atividade ainda não executada |
| Correção e regressão | Corrigir defeitos, repetir testes afetados e consolidar evidências | Conforme achados | Depende dos resultados das fases anteriores; marco: relatório final |

O workflow do GitHub Actions estabelece como marcos automatizados a instalação
com `npm ci`, geração do Prisma Client, aplicação das migrations, typecheck,
build, testes com cobertura, testes de sistema e análise SonarQube.

As datas acadêmicas informadas no documento da A3, e não extraídas do
repositório, são:

- **02/12/2026:** entrega no Ulife;
- **04/12/2026 em diante:** apresentações.

Essas datas são marcos acadêmicos, não estimativas de esforço. As estimativas
da tabela representam duração aproximada de cada fase e não devem ser
interpretadas como datas oficiais de execução.

## 2.9 Responsabilidades

O histórico Git consultado identifica um único autor efetivo:
`gabriel.lopes`/Gabriel Corrêa Lopes. O README também identifica Gabriel Corrêa
Lopes como autor do projeto. Assim, não foram inventados integrantes
adicionais. Não há no repositório evidência sobre autorização formal para
trabalho individual.

As responsabilidades exigidas são organizadas nos quatro papéis abaixo:

- **Líder:** coordenação do plano, escopo, cronograma, critérios e evidências;
- **Desenvolvedor:** implementação e manutenção das funcionalidades e correções;
- **Testador:** elaboração, execução e análise dos testes;
- **Especialista em DevOps:** manutenção do CI, ambiente, migrations e
  integração das ferramentas de qualidade.

Gabriel Corrêa Lopes executa as atividades identificadas no histórico Git,
abrangendo atividades correspondentes aos quatro papéis no estado atual do
projeto. A distribuição formal desses papéis e a autorização para trabalho
individual dependem da confirmação do professor. A validação acadêmica do
escopo e dos critérios também é responsabilidade do professor, mas não está
registrada como execução no Git.

| Nome do aluno | Funcionalidade | Link dos arquivos de testes unitários da funcionalidade |
|---|---|---|
| Gabriel Corrêa Lopes | Produtos: cadastro, listagem, consulta, SKU duplicado e validações | [product.service.unit.test.ts](../../backend/src/product.service.unit.test.ts) |
| Gabriel Corrêa Lopes | Movimentações: entrada, saída, estoque insuficiente, produto inexistente, quantidade e histórico | [stock-movement.service.unit.test.ts](../../backend/src/stock-movement.service.unit.test.ts) |

Os testes de integração e de sistema complementares estão em
[products.test.ts](../../backend/src/products.test.ts),
[stock-movement.test.ts](../../backend/src/stock-movement.test.ts),
[server.test.ts](../../backend/src/server.test.ts) e
[stockflow.system.test.ts](../../backend/src/system/stockflow.system.test.ts).

## 2.10 Critérios de aceitação

### Critérios exigidos

São considerados critérios de aceitação da A3:

- cobertura mínima de 75% para statements, branches, functions e lines;
- aprovação no SonarQube Quality Gate;
- resolução dos issues identificados pela análise de qualidade, especialmente
  os problemas de segurança;
- execução bem-sucedida dos testes unitários, de integração e de sistema;
- execução reproduzível no GitHub Actions.

### Resultados registrados

Os quantitativos registrados para a entrega são:

- 34 testes unitários e de integração;
- 10 testes de sistema;
- 44 testes no total;
- cobertura informada de 87,16% em statements, 83,63% em branches, 85,71%
  em functions e 87,07% em lines;
- Quality Gate informado como aprovado;
- issues de segurança informados como corrigidos.

Os issues de segurança mencionados acima são findings da análise estática do
SonarQube Cloud. Eles não devem ser confundidos com eventuais GitHub Issues
abertas pelo professor para avaliação acadêmica. A verificação de Issues
acadêmicas depende de consulta ao repositório GitHub e não é comprovada apenas
pela análise do SonarQube.

O repositório permite verificar a existência dos scripts, dos arquivos de teste,
dos thresholds de 75% e das etapas de cobertura e SonarQube no workflow. Porém,
o workflow versionado não armazena o relatório textual de uma execução
específica, nem o resultado do Quality Gate ou um relatório de issues. Por
isso, os valores de branches de 83,63%, a aprovação do Quality Gate e a
correção dos issues são registrados aqui como resultados fornecidos para a
entrega, mas precisam ser acompanhados dos respectivos artefatos do CI ou do
SonarQube para serem considerados comprovados documentalmente.

Há também uma distinção de nomenclatura: os 34 testes correspondem aos testes
unitários e de integração, enquanto os 10 testes de sistema são executados por
script separado. O critério de cobertura é aplicado pela configuração do
Vitest à suíte normal; os testes de sistema não são usados para inflar esse
relatório.

## 2.11 Gestão de defeitos

O processo de gestão de defeitos seguirá as seguintes etapas:

1. **Identificação:** registrar a falha observada, o teste ou análise que a
   revelou, o ambiente e os passos para reprodução.
2. **Registro:** abrir uma GitHub Issue com descrição objetiva, evidência,
   comportamento esperado e comportamento observado.
3. **Priorização:** avaliar impacto funcional, segurança, confiabilidade e
   urgência, classificando o defeito antes da correção.
4. **Correção:** implementar a alteração no código ou configuração relacionada,
   sem remover o teste que demonstrou o problema.
5. **Validação:** executar o teste que falhou, os testes relacionados,
   typecheck, build e a suíte de regressão.
6. **Encerramento:** atualizar a Issue com a evidência da correção e fechar
   somente após a validação.

O histórico de commits mostra práticas de mensagens com prefixos `test:`,
`fix:`, `security:`, `ci:` e `feat:`, que devem ser preservadas ao registrar
correções. A Issue deve ser relacionada ao commit ou pull request
correspondente quando esse fluxo for utilizado. Não há, no histórico local
consultado, um catálogo formal de Issues ou uma política de severidade
documentada; esses detalhes precisam ser confirmados para a entrega final.

## 2.12 Relatórios e métricas

### Relação entre funcionalidades e testes

| Funcionalidade | Testes relacionados | Nível |
|---|---|---|
| Health check, CORS e headers de segurança | [server.test.ts](../../backend/src/server.test.ts), [stockflow.system.test.ts](../../backend/src/system/stockflow.system.test.ts) | Integração e sistema |
| Cadastro, listagem e consulta de produtos | [product.service.unit.test.ts](../../backend/src/product.service.unit.test.ts), [products.test.ts](../../backend/src/products.test.ts), [stockflow.system.test.ts](../../backend/src/system/stockflow.system.test.ts) | Unitário, integração e sistema |
| Entrada, saída e atualização de saldo | [stock-movement.service.unit.test.ts](../../backend/src/stock-movement.service.unit.test.ts), [stock-movement.test.ts](../../backend/src/stock-movement.test.ts), [stockflow.system.test.ts](../../backend/src/system/stockflow.system.test.ts) | Unitário, integração e sistema |
| Estoque insuficiente e consistência transacional | [stock-movement.service.unit.test.ts](../../backend/src/stock-movement.service.unit.test.ts), [stock-movement.test.ts](../../backend/src/stock-movement.test.ts), [stockflow.system.test.ts](../../backend/src/system/stockflow.system.test.ts) | Unitário, integração e sistema |
| Histórico de movimentações | [stock-movement.service.unit.test.ts](../../backend/src/stock-movement.service.unit.test.ts), [stock-movement.test.ts](../../backend/src/stock-movement.test.ts), [stockflow.system.test.ts](../../backend/src/system/stockflow.system.test.ts) | Unitário, integração e sistema |

### Métricas do Vitest

O Vitest mede cobertura dinâmica do código incluído em `src`, excluindo os
arquivos de teste e o Prisma Client gerado. As métricas são statements,
branches, functions e lines. O critério configurado é de pelo menos 75% em
cada métrica, com relatórios text, LCOV e HTML.

Para a entrega, estão registrados 87,16% de statements, 83,63% de branches,
85,71% de functions e 87,07% de lines. O relatório LCOV é consumido pelo
SonarQube. A data e a execução específica que produziram esses valores não
estão armazenadas no repositório.

### Métricas do SonarQube Cloud

O SonarQube Cloud realiza análise estática independente da cobertura do Vitest.
A análise considera o backend, importa `coverage/lcov.info` e exclui código
gerado do Prisma, testes e migrations. As dimensões relevantes para o
acompanhamento são:

- segurança e vulnerabilidades;
- confiabilidade e bugs;
- manutenibilidade;
- duplicação;
- complexidade e demais indicadores apresentados pelo SonarQube;
- Quality Gate.

O histórico Git contém commits relacionados à integração e à limpeza da análise
SonarQube e commits de correção de segurança. Contudo, não há no repositório
um relatório exportado com valores anteriores e posteriores ao Quality Gate.
Assim, não é possível apresentar uma comparação quantitativa anterior/posterior
sem inventar evidências. A aprovação do Quality Gate e a resolução dos issues
devem ser comprovadas pelos links ou capturas do SonarQube/CI na versão final.

As métricas finais do SonarQube devem ser registradas separadamente das métricas
do Vitest:

| Métrica do SonarQube | Resultado disponível | Situação da comprovação |
|---|---|---|
| Quality Gate | Aprovado, conforme resultado informado para a entrega | Requer link ou captura da execução no SonarQube |
| Segurança | Issues identificados foram corrigidos, conforme registro da atividade | Requer relatório ou evidência dos findings e da resolução |
| Confiabilidade | Valor não informado | Pendente de captura no SonarQube |
| Manutenibilidade | Valor não informado | Pendente de captura no SonarQube |
| Duplicação | Valor não informado | Pendente de captura no SonarQube |
| Complexidade | Valor não informado | Pendente de captura no SonarQube |

Não são inventados valores para segurança, confiabilidade, manutenibilidade,
duplicação ou complexidade. A cobertura percentual apresentada anteriormente
é métrica do Vitest/LCOV, ainda que seja importada pelo SonarQube, e não deve
ser apresentada como substituta das métricas próprias da análise estática.

## 2.13 Controle de versão

O projeto é mantido no repositório
[Gabriel-c-l/stockflow](https://github.com/Gabriel-c-l/stockflow), com `main`
como branch principal.

A estrutura relevante identificada inclui:

- [README.md](../../README.md) e
  [README.pt-BR.md](../../README.pt-BR.md), com descrição acadêmica, objetivos
  e funcionalidades planejadas;
- [LICENSE](../../LICENSE);
- [backend/src](../../backend/src), com rotas, controllers, services,
  repositories, tipos, scripts e testes;
- [backend/prisma](../../backend/prisma), com schema e migrations;
- [backend/package.json](../../backend/package.json), com scripts e
  dependências;
- [docs/test-plan](.), com este plano de testes;
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml), com as etapas de
  integração contínua.

O histórico real consultado apresenta convenções de mensagens como:

- `feat:` para implementação de funcionalidade;
- `test:` para criação ou ampliação de testes;
- `fix:` para correções;
- `security:` para correções relacionadas à segurança;
- `ci:` para alterações de integração contínua;
- mensagens de preparação ou sincronização quando aplicável.

Exemplos identificados incluem commits de implementação do backend, adição de
testes unitários, adição de testes E2E, restrição de CORS, integração do
SonarQube e ajustes de CI. A convenção observada deve ser mantida para que
alterações de código, testes e infraestrutura permaneçam identificáveis no
histórico. Não há evidência de outros participantes no histórico consultado.
