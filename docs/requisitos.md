# Requisitos do StockFlow

## 1. Visão geral e problema

O StockFlow é um sistema acadêmico de gestão de estoque desenvolvido para as
A3 das unidades curriculares de Garantia e Qualidade de Software e Banco de
Dados da UNISUL. A solução possui uma interface web, uma API backend e um banco
relacional PostgreSQL.

O problema abordado é a falta de controle centralizado e rastreável sobre
produtos, fornecedores, entradas, saídas e saldos. O sistema busca reduzir
registros inconsistentes, impedir estoque negativo e manter o histórico das
movimentações.

## 2. Usuários e atores

| Ator | Responsabilidades | Permissões implementadas |
|---|---|---|
| Administrador (`ADMIN`) | Administrar usuários e configurações operacionais | Gerencia usuários; pode criar, editar e desativar produtos, categorias e fornecedores; acessa os demais módulos autenticados |
| Gestor (`MANAGER`) | Acompanhar o estoque, manter cadastros e consultar indicadores | Pode criar, editar e desativar produtos, categorias e fornecedores; acessa dashboard e movimentações |
| Operador (`OPERATOR`) | Consultar inventário e registrar movimentações | Consulta dados operacionais e registra entradas/saídas; não acessa a administração de usuários |

Os três perfis são definidos pelo enum `UserRole`. Todas as rotas de produtos,
categorias, fornecedores, dashboard, movimentações e usuários exigem sessão
autenticada. A gestão de usuários é exclusiva de `ADMIN`; operações de criação,
alteração e desativação de produtos, categorias e fornecedores exigem `ADMIN`
ou `MANAGER`.

## 3. Requisitos funcionais

| ID | Requisito | Descrição | Situação atual | Critério de aceitação resumido |
|---|---|---|---|---|
| RF01 | Produtos | Cadastrar, listar, consultar, editar e desativar produtos, com SKU, nome, descrição, preço, quantidade, estoque mínimo, categoria, unidade e localização | Implementado | Dados válidos são persistidos; SKU duplicado é rejeitado; desativação preserva o histórico |
| RF02 | Categorias | Cadastrar, listar, consultar, editar e desativar categorias | Implementado | Nome único e operações autorizadas conforme perfil |
| RF03 | Fornecedores | Cadastrar, listar, consultar, editar e desativar fornecedores | Implementado | Dados são validados; identificador fiscal, quando informado, respeita unicidade |
| RF04 | Entradas | Registrar entrada de produto, quantidade, data, fornecedor e custo unitário opcional | Implementado por `StockMovement` com `type=ENTRY` | A entrada válida cria movimentação e incrementa o saldo na mesma transação |
| RF05 | Saídas | Registrar saída de produto, quantidade, data e destinatário | Implementado por `StockMovement` com `type=EXIT` | A saída válida cria movimentação e reduz o saldo; saldo insuficiente retorna HTTP 409 |
| RF06 | Histórico de movimentações | Consultar movimentações gerais e histórico por produto | Implementado | A API retorna os registros relacionados ao produto ou ao inventário |
| RF07 | Funcionários/usuários | Cadastrar e gerenciar pessoas com nome, cargo/perfil, email de acesso e senha | Implementado pelo modelo `User` | Usuário é criado com hash de senha; gestão restrita a `ADMIN` |
| RF08 | Autenticação | Login, logout, consulta da sessão atual e revogação | Implementado | Sessão persistida, token armazenado como hash e cookie HttpOnly |
| RF09 | Preferência de idioma | Manter preferência de idioma por usuário | Implementado | Preferência `en` ou `pt-BR` é persistida e recuperada na sessão |
| RF10 | Dashboard | Exibir indicadores de estoque, movimentações e distribuição por categoria | Implementado | Endpoint autenticado retorna os agregados usados pela interface |
| RF11 | Relatórios | Disponibilizar relatórios de inventário com filtros, período e detalhes | Parcial / pendente | Existe item de navegação e tela placeholder; falta definir escopo, implementar API e apresentar resultados reais |

### Observação sobre funcionários e usuários

O cadastro de funcionários é representado pelo modelo relacional `User`, que
contém nome, email de acesso, hash de senha, perfil, situação e preferência de
idioma. Não existe uma segunda tabela `Employee`, pois os dados de identidade e
acesso pertencem ao mesmo registro. Deve-se confirmar com o professor se a
representação por `User` atende integralmente ao termo “Funcionários” do tema
ou se é exigida uma entidade separada.

### Observação sobre entradas e saídas

Entradas e saídas não usam tabelas independentes. Ambas são armazenadas em
`StockMovement`, diferenciadas pelo enum `StockMovementType` (`ENTRY` e
`EXIT`). Essa modelagem evita duplicação de atributos e mantém um histórico
unificado. A tabela também permite associar fornecedor, custo unitário,
destinatário, responsável e observações quando aplicável.

## 4. Requisitos não funcionais

| ID | Objetivo | Verificação | Situação |
|---|---|---|---|
| RNF01 | Segurança | Argon2id para senha, hash do token de sessão, cookie HttpOnly, CSRF, CORS, autorização por perfil e análise estática | Implementado em parte; ainda requer revisão final dos findings do SonarCloud |
| RNF02 | Desempenho | Medir tempo de resposta, p50/p95/p99, throughput e erros sob carga controlada | Não medido; scripts k6 preparados |
| RNF03 | Escalabilidade | Avaliar comportamento com diferentes volumes e níveis de concorrência | Não medido; o teste de duas saídas simultâneas valida integridade, não capacidade de carga |
| RNF04 | Confiabilidade e integridade | Transações, saldo não negativo, histórico consistente e concorrência | Implementado e coberto por testes funcionais/sistema |
| RNF05 | Manutenibilidade | Separação em camadas, typecheck, build, testes, revisão Sonar e CI | Implementado; Quality Gate ainda precisa ser aprovado após a correção da configuração e cobertura |
| RNF06 | Usabilidade | Avaliar tarefas reais por usuários e registrar sucesso, erros e percepção | Pendente de execução documentada |
| RNF07 | Internacionalização | Disponibilizar interface em inglês e português brasileiro | Implementado nos fluxos verificados; revisão final de todas as telas recomendada |

### 4.1 Segurança e controle de acesso

As senhas são armazenadas por hash Argon2id. As sessões são persistidas no
PostgreSQL, com o hash SHA-256 do token aleatório, expiração e revogação. O
cookie da sessão é HttpOnly. O backend utiliza proteção CSRF e uma lista
explícita de origens permitidas por `CORS_ORIGINS`; o Express desativa
`X-Powered-By`.

O middleware `authorize` restringe a administração de usuários ao perfil
`ADMIN` e operações de manutenção de produtos, categorias e fornecedores aos
perfis `ADMIN` e `MANAGER`. CORS restringe o acesso cross-origin de navegadores,
mas não substitui autenticação ou autorização.

### 4.2 Desempenho e escalabilidade

A pasta `backend/performance` contém cenários k6 para consulta de produtos,
cadastro de produtos e movimentações. Há também scripts para preparar e limpar
massa sintética em um banco local isolado chamado `stockflow_perf`. O README da
pasta declara que os testes ainda não foram executados e que os limites de
aceitação precisam ser definidos. Portanto, não há resultados de desempenho a
declarar.

### 4.3 Integridade em saídas concorrentes

A saída usa uma atualização condicional no PostgreSQL (`quantity >= quantidade
solicitada`) e uma transação que inclui a criação da movimentação. O teste de
sistema informado para o projeto usa saldo inicial de 10 e duas saídas
simultâneas de 7: uma resposta HTTP 201 e outra HTTP 409, saldo final 3 e somente
uma nova movimentação de saída. Esse cenário comprova a regra de integridade
para essa condição concorrente específica, mas não comprova throughput ou
escalabilidade sob carga.

## 5. Regras de negócio

| ID | Regra |
|---|---|
| RN01 | O SKU do produto é obrigatório e único |
| RN02 | Nome do produto e nome de categoria são obrigatórios |
| RN03 | Preço, custo unitário e quantidades devem respeitar os formatos e limites definidos pelos schemas |
| RN04 | O estoque não deve ser alterado diretamente no formulário de produto; deve ser alterado por movimentação |
| RN05 | Movimentações aceitam exclusivamente `ENTRY` e `EXIT` |
| RN06 | A quantidade de cada movimentação deve ser um inteiro positivo |
| RN07 | `ENTRY` aumenta o saldo disponível |
| RN08 | `EXIT` reduz o saldo disponível |
| RN09 | Uma saída não pode resultar em estoque negativo |
| RN10 | Atualização do saldo e gravação da movimentação devem ocorrer na mesma transação |
| RN11 | O histórico de movimentações deve ser preservado |
| RN12 | Produtos, categorias e fornecedores são desativados logicamente quando aplicável, preservando referências históricas |
| RN13 | Somente `ADMIN` pode administrar usuários |
| RN14 | Somente `ADMIN` ou `MANAGER` podem criar, editar ou desativar produtos, categorias e fornecedores |
| RN15 | Preferências de idioma aceitam `en` ou `pt-BR` |

## 6. Visão relacional do banco de dados

O banco PostgreSQL é gerenciado pelo Prisma e possui seis modelos:

| Modelo | Responsabilidade |
|---|---|
| `User` | Usuários/funcionários, credenciais com hash, perfil e idioma |
| `Session` | Sessões autenticadas, token hash, expiração e revogação |
| `Category` | Classificação de produtos |
| `Product` | Produtos, preço, saldo, estoque mínimo, unidade e localização |
| `StockMovement` | Histórico unificado de entradas e saídas |
| `Supplier` | Dados de fornecedores e relações com movimentações |

Relacionamentos principais:

- uma categoria pode possuir vários produtos; cada produto pode pertencer a uma categoria;
- um produto pode possuir várias movimentações;
- um usuário pode possuir várias sessões e ser responsável por várias movimentações;
- um fornecedor pode estar associado a várias movimentações;
- uma movimentação pertence a um produto e pode referenciar fornecedor e responsável.

As migrations versionadas em `backend/prisma/migrations` constroem o schema.
O dicionário de dados detalhado está em
`docs/banco-de-dados/dicionario-de-dados.md` e descreve tipos, nulabilidade,
chaves, defaults, índices e regras de cada coluna. Ele deve ser conferido com
o schema e as migrations antes da entrega da UC Banco de Dados.

## 7. Fluxo operacional principal

1. O usuário autentica-se no StockFlow.
2. Um administrador ou gestor mantém categorias, fornecedores e produtos.
3. O operador ou gestor consulta o inventário.
4. Uma entrada é registrada com produto, quantidade e dados de fornecedor, quando aplicável.
5. Uma saída é registrada com produto, quantidade e destinatário.
6. O backend valida os dados, atualiza o saldo e grava a movimentação em transação.
7. O dashboard apresenta indicadores calculados a partir dos produtos e movimentações.
8. O histórico permanece disponível para consulta e rastreabilidade.

## 8. Limitações e decisões pendentes

- O módulo de relatórios está representado somente por um placeholder na interface; falta definir os relatórios necessários e implementar os endpoints/consultas correspondentes.
- É necessário confirmar com o professor se `User` satisfaz o requisito de Funcionários ou se é exigida uma tabela própria `Employee`.
- Testes de desempenho com k6 ainda não foram executados; cargas e limites devem ser confirmados antes da medição.
- Testes formais de usabilidade ainda precisam ser planejados e documentados.
- A análise SonarCloud da versão registrada no commit `408edc6` reprovou o Quality Gate por cobertura de código novo de 71,71% (mínimo 80%) e duplicação de 4,27% (máximo 3%). As correções de classificação e cobertura estão sendo preparadas e dependem de nova execução no GitHub Actions.
- O dicionário de dados inicial foi produzido em `docs/banco-de-dados/dicionario-de-dados.md`; falta revisão final com o professor e conferência após a última alteração de schema.
- A apresentação específica da UC Banco de Dados ainda precisa ser preparada.
