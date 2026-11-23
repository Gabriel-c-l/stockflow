# Requisitos do StockFlow

## 1. Visão geral e problema

O StockFlow é um sistema acadêmico de gestão de estoque desenvolvido para a
A3 da unidade curricular Garantia e Qualidade de Software da UNISUL. A entrega
atual consiste em uma API backend construída com Node.js, TypeScript, Express,
Prisma e PostgreSQL.

O problema abordado pelo sistema é a falta de controle centralizado e
consistente sobre produtos e alterações de quantidade em estoque. Sem
registro único das entradas e saídas, existe o risco de saldo incorreto,
estoque negativo e ausência de rastreabilidade.

O objetivo do StockFlow é permitir o cadastro de produtos, a consulta de saldo,
o registro de entradas e saídas e a preservação do histórico dessas
movimentações. O sistema atual não oferece interface gráfica; os usuários
conceituais interagem por meio da API HTTP.

O público previsto é composto por profissionais responsáveis pelo
operacional e pelo acompanhamento do estoque. O presente escopo implementado
não inclui autenticação, perfis ou interface visual.

## 2. Usuários e atores

Os atores abaixo são atores conceituais de negócio. O backend não implementa
identidade, autenticação, autorização ou permissões por perfil.

| Ator | Responsabilidades | Interação com o sistema |
|---|---|---|
| Operador de estoque | Cadastrar produtos, consultar produtos e registrar entradas e saídas | Utiliza os endpoints de produtos e movimentações da API |
| Gestor de estoque | Acompanhar saldos e consultar o histórico de movimentações | Utiliza os endpoints de consulta e histórico da API |

A ausência de autenticação significa que qualquer cliente capaz de alcançar a
API pode tentar invocar os endpoints disponíveis. CORS controla o acesso
cross-origin de navegadores às respostas da API, mas não identifica o usuário
nem substitui autenticação ou autorização.

## 3. Requisitos funcionais

| ID | Nome | Descrição | Prioridade | Situação | Critério de aceitação |
|---|---|---|---|---|---|
| RF01 | Cadastro de produtos | Permitir cadastrar um produto com SKU, nome, descrição opcional e estoque mínimo | Alta | Implementado | A API valida os dados, persiste o produto e retorna HTTP 201 |
| RF02 | Listagem de produtos | Permitir listar os produtos cadastrados | Alta | Implementado | A API retorna HTTP 200 e uma coleção de produtos |
| RF03 | Consulta de produto | Permitir consultar um produto pelo identificador UUID | Alta | Implementado | Produto existente retorna HTTP 200; produto inexistente retorna HTTP 404 |
| RF04 | Registro de entrada | Permitir registrar uma entrada de estoque de um produto existente | Alta | Implementado | A entrada válida retorna HTTP 201 e incrementa o saldo |
| RF05 | Registro de saída | Permitir registrar uma saída de estoque de um produto existente | Alta | Implementado | A saída válida retorna HTTP 201 e reduz o saldo sem torná-lo negativo |
| RF06 | Consulta do histórico | Permitir consultar todas as movimentações registradas de um produto | Alta | Implementado | O produto existente retorna HTTP 200 e o histórico; produto inexistente retorna HTTP 404 |
| RF07 | Geração de relatórios de inventário | Permitir gerar ou consultar relatórios de inventário | Média | Não implementado | Critérios dependem da definição das métricas e formatos de relatório |

RF01 inclui os dados suportados pelo modelo atual. Categoria e preço não fazem
parte do cadastro implementado.

### Modelagem de usuários preparada

O banco agora também pode registrar usuários por meio do modelo `User`, com
papéis `ADMIN`, `MANAGER` e `OPERATOR`. Usuários possuem email único, hash de
senha, estado ativo e timestamps. Esta etapa não implementa autenticação,
login, cookies ou JWT.

Quando a autenticação futura for implementada, movimentações novas poderão
registrar `performedById`. O campo é opcional nesta etapa para preservar
movimentações criadas anteriormente, que continuarão sem autor identificado.
Não são criados usuários fictícios nem atribuídas pessoas às movimentações
históricas.

O bootstrap administrativo será preparado em uma etapa posterior. O mecanismo
deverá criar o primeiro administrador somente quando não existir nenhum
administrador ativo ou inativo já cadastrado, utilizando nome, email e
credencial fornecidos por variáveis de ambiente. A senha deverá ser transformada
em hash Argon2id antes da persistência. Nenhuma senha padrão será incorporada ao
código, e o mecanismo não deverá criar administradores adicionais depois da
configuração inicial.

### Sessões e autenticação preparadas

O backend possui endpoints de login, logout e perfil autenticado por sessão
persistida. A sessão contém apenas o hash do token aleatório, data de expiração,
revogação e usuário associado. O cookie é HttpOnly e não é armazenado em
localStorage.

As rotas de produtos e movimentações não foram protegidas definitivamente por
funções nesta etapa. A autorização por matrizes de papéis poderá ser aplicada
posteriormente sem alterar o modelo de sessão.

## 4. Requisitos não funcionais

| ID | Objetivo | Justificativa | Forma de verificação | Situação |
|---|---|---|---|---|
| RNF01 | Segurança da aplicação | Limitar origens HTTP, impedir que a API divulgue o cabeçalho `X-Powered-By` e evitar operações inválidas | Testes de CORS e de cabeçalhos, SonarQube Cloud e revisão do CI | Implementado parcialmente |
| RNF02 | Desempenho da API | Garantir tempos de resposta adequados nos principais endpoints | Medição futura de cadastro, consulta, movimentação e histórico sob cargas definidas | Não medido |
| RNF03 | Escalabilidade | Sustentar crescimento de produtos, movimentações e concorrência | O teste já executado de duas saídas simultâneas comprova a integridade da regra de negócio em um cenário concorrente específico, mas não mede capacidade, throughput ou escalabilidade. Testes de carga ainda pendentes deverão avaliar essas características em ambiente controlado | Não medido |
| RNF04 | Confiabilidade e integridade | Evitar saldo negativo, saída não registrada ou alteração parcial de estoque | Transações Prisma, testes de integração e testes E2E, inclusive concorrência | Implementado |
| RNF05 | Manutenibilidade | Facilitar correções e evolução por separação de responsabilidades | Estrutura por rotas, controllers, services, repositories e types; typecheck, build e análise SonarQube | Implementado |

### 4.1 Segurança

O sistema configura uma lista explícita de origens permitidas por meio da
variável `CORS_ORIGINS`. Origens configuradas recebem o cabeçalho CORS
correspondente, enquanto origens não configuradas não recebem esse cabeçalho;
portanto, navegadores impedem o JavaScript de acessar a resposta nessas
origens. Isso não impede necessariamente que a requisição alcance a API, e
CORS não constitui autenticação ou autorização de usuário. Requisições sem
cabeçalho `Origin` continuam válidas para ferramentas como curl.

O Express desativa `X-Powered-By`. Autenticação, autorização por atores,
controle de sessão e criptografia de credenciais não existem nesta entrega.

### 4.2 Desempenho e escalabilidade

Não foram definidos resultados numéricos de tempo de resposta, throughput ou capacidade do sistema. O cenário funcional de duas saídas simultâneas está coberto por teste automatizado, mas não representa uma avaliação de desempenho ou escalabilidade sob carga. Essas avaliações ainda dependem da definição de critérios quantitativos e da execução de testes em ambiente controlado.

### 4.3 Integridade em saídas concorrentes

A implementação atual protege saídas concorrentes por meio de uma transação
Prisma e uma atualização condicional no PostgreSQL:

- a saída utiliza `updateMany` com condição `quantity >= quantidade solicitada`;
- a primeira atualização que obtiver a quantidade disponível registrada é
  aprovada;
- a outra requisição encontra zero registros atualizados e retorna HTTP 409;
- a movimentação é criada somente após a atualização aprovada;
- atualização e criação acontecem na mesma transação.

Esse comportamento está coberto por um teste de sistema real com PostgreSQL:

- saldo inicial de 10;
- duas saídas simultâneas de 7;
- uma resposta HTTP 201 e outra HTTP 409;
- saldo final 3;
- somente uma movimentação EXIT de 7 no histórico, além da entrada inicial.

## 5. Regras de negócio

| ID | Regra |
|---|---|
| RN01 | O SKU é obrigatório, não pode ser vazio após remoção de espaços e deve ser único |
| RN02 | O nome do produto é obrigatório e não pode ser vazio após remoção de espaços |
| RN03 | `minStock` é opcional na entrada, usa padrão zero e não pode ser negativo |
| RN04 | O cadastro não aceita `quantity`; o estoque inicia com valor zero no modelo |
| RN05 | Alterações de estoque devem ocorrer por `ENTRY` ou `EXIT` |
| RN06 | `quantity` da movimentação deve ser um número inteiro maior que zero |
| RN07 | O tipo da movimentação deve ser exclusivamente `ENTRY` ou `EXIT` |
| RN08 | `ENTRY` aumenta o saldo pela quantidade informada |
| RN09 | `EXIT` diminui o saldo pela quantidade informada |
| RN10 | Uma saída não pode ser registrada quando a quantidade solicitada supera o saldo disponível |
| RN11 | A atualização do saldo e o registro da movimentação devem ocorrer na mesma transação |
| RN12 | Os registros de movimentação devem ser preservados como histórico |

RN01 é aplicada pelo campo único no Prisma e pelo tratamento de conflito
`P2002` no service. RN03 é validada por Zod. RN10 é aplicada pela condição
condicional no banco, e não apenas por uma verificação em memória.

## 6. Fluxo principal

Este fluxo descreve utilização conceitual da API. Não existe frontend
implementado para fornecer uma interface aos atores.

1. O operador cadastra um produto por `POST /products`.
2. O sistema valida SKU, nome e demais campos aceitos.
3. O sistema registra o produto com saldo inicial zero e retorna HTTP 201.
4. O operador registra uma entrada por `POST /stock-movements`.
5. O sistema verifica a existência do produto e atualiza o saldo.
6. O sistema registra a movimentação `ENTRY`.
7. O operador consulta o produto por `GET /products/:id` e verifica o saldo.
8. O operador registra uma saída por `POST /stock-movements`.
9. O sistema verifica se existe saldo suficiente.
10. O sistema atualiza o saldo e registra a movimentação `EXIT`.
11. O gestor ou operador consulta `GET /products/:id/movements`.

### 6.1 Fluxos alternativos

| Alternativa | Comportamento esperado |
|---|---|
| SKU duplicado | O sistema retorna HTTP 409 sem cadastrar outro produto |
| Dados inválidos | O sistema retorna HTTP 400 com indicação dos dados inválidos |
| Produto inexistente em movimentação ou consulta | O sistema retorna HTTP 404 |
| Estoque insuficiente | O sistema retorna HTTP 409, mantém o saldo e não registra o EXIT |
| Produto inexistente no histórico | O sistema retorna HTTP 404 |
| Duas saídas concorrentes de 7 com saldo inicial 10 | Uma retorna HTTP 201, a outra HTTP 409, o saldo final fica 3 e somente uma saída fica registrada |

## 7. Critérios de aceitação

| ID | Requisito | Critério objetivo |
|---|---|---|
| CA01 | RF01 | Cadastro válido retorna HTTP 201, com UUID, SKU, nome, saldo zero e campos padrão |
| CA02 | RF01 | SKU duplicado retorna HTTP 409 |
| CA03 | RF01 | Nome vazio, SKU vazio ou `minStock` negativo retorna HTTP 400 |
| CA04 | RF01 | A API não aceita `quantity` no cadastro e retorna HTTP 400 |
| CA05 | RF02 | `GET /products` retorna HTTP 200 e a coleção persistida |
| CA06 | RF03 | Produto existente em `GET /products/:id` retorna HTTP 200 |
| CA07 | RF03 | Produto inexistente em `GET /products/:id` retorna HTTP 404 |
| CA08 | RF04 | Entrada válida retorna HTTP 201 e aumenta o saldo no mesmo valor registrado |
| CA09 | RF05 | Saída válida retorna HTTP 201 e reduz o saldo sem torná-lo negativo |
| CA10 | RF05 | Saída superior ao saldo disponível retorna HTTP 409 e não altera saldo nem histórico |
| CA11 | RF06 | Histórico de produto existente retorna HTTP 200 e as movimentações registradas |
| CA12 | RF06 | Histórico de produto inexistente retorna HTTP 404 |
| CA13 | RNF01 | Origens configuradas recebem o cabeçalho CORS correspondente; origens não configuradas não recebem o cabeçalho CORS; requisições sem `Origin` continuam funcionando |
| CA14 | RNF04 | Duas saídas simultâneas de 7 com saldo 10 resultam exatamente em um HTTP 201 e um HTTP 409 |
| CA15 | RNF04 | Após CA14, o saldo final é 3 e o histórico contém uma entrada inicial e uma única saída de 7 |
| CA16 | RF07 | Critério pendente: formato, frequência, dados e HTTP ainda não definidos nem implementados |
| CA17 | RNF02 e RNF03 | Critérios pendentes: definir cargas, critérios quantitativos e ferramentas, executar as medições |

Os critérios CA16 e CA17 não representam resultados obtidos. Eles identificam
lacunas que dependem de implementação, definição acadêmica ou medição.

## 8. Lacunas em relação ao modelo proposto na A3

| Item solicitado pela A3 | Estado atual do Prisma | Situação |
|---|---|---|
| Produtos: ID, nome, categoria, preço e quantidade | `Product` possui `id`, `name`, `quantity` e outros campos, mas não possui categoria nem preço | Parcial |
| Entradas: ID, produto, quantidade, data e fornecedor | `StockMovement` possui `id`, `productId`, `quantity`, `createdAt` e `type=ENTRY`; não possui fornecedor | Parcial |
| Saídas: ID, produto, quantidade, data e destinatário | `StockMovement` possui `id`, `productId`, `quantity`, `createdAt` e `type=EXIT`; não possui destinatário | Parcial |
| Funcionários: ID, nome, cargo, login e senha | Não existe model, migration, repository ou endpoint correspondente | Não implementado |
| Relatórios: ID, tipo, data e detalhes | Não existe model, migration, repository ou endpoint correspondente | Não implementado |

As entidades solicitadas não foram implementadas nesta entrega. A lacuna
reduz o escopo funcional verificável da A3: os requisitos de produto, entrada,
saída e histórico podem ser avaliados pelo backend atual, enquanto categoria,
preço, fornecedor, destinatário, funcionários e relatórios dependem de novas
especificações e implementação.
