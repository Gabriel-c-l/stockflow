# StockFlow — API de Gestão de Estoque

[English](README.md) | [Português (Brasil)](README.pt-BR.md)

**Status:** Em desenvolvimento

O StockFlow é um projeto acadêmico de gestão de estoque desenvolvido para a
unidade curricular de Garantia e Qualidade de Software da UNISUL. A entrega
atual é um backend/API em desenvolvimento, com foco em produtos e
movimentações de estoque.

## Funcionalidades

A API atualmente implementada oferece:

- Verificação de saúde com `GET /health`.
- Cadastro de produtos com `POST /products`.
- Listagem de produtos com `GET /products`.
- Consulta de produto por ID com `GET /products/:id`.
- Entradas e saídas de estoque com `POST /stock-movements`.
- Histórico de movimentações com `GET /products/:id/movements`.

A pasta `frontend/` existe apenas como estrutura inicial do projeto; nenhuma
funcionalidade de frontend está implementada na entrega atual.

### Regras de negócio

- O SKU é único.
- Os campos obrigatórios são validados.
- A quantidade da movimentação deve ser um inteiro positivo.
- Movimentações `ENTRY` aumentam o estoque disponível.
- Movimentações `EXIT` diminuem o estoque disponível.
- Uma saída não pode exceder o estoque disponível.
- A atualização do saldo do produto e o registro da movimentação ocorrem na
  mesma transação do banco de dados.
- O histórico de movimentações é preservado.

## Stack tecnológica

| Área | Tecnologia |
|---|---|
| Runtime | Node.js 24 |
| Linguagem | TypeScript 7.0.2 |
| API | Express 5.3.0 |
| Banco de dados | PostgreSQL 16 |
| ORM e migrations | Prisma 7.10.1 |
| Validação | Zod 4.6.7 |
| Testes unitários e de integração | Vitest 5.1.0 |
| Testes HTTP de integração | Supertest 7.3.2 |
| Integração contínua | GitHub Actions |
| Análise estática | SonarQube Cloud |

As dependências adicionais do backend incluem `cors`, `dotenv`, `pg`,
`@prisma/adapter-pg` e o Prisma Client gerado.

## Arquitetura

O backend segue uma estrutura em camadas:

- **Routes:** mapeiam caminhos e métodos HTTP para controllers.
- **Controllers:** interpretam requisições, chamam services e montam respostas
  HTTP.
- **Services:** concentram regras de negócio e orquestração de transações.
- **Repositories:** acessam Products e StockMovements por meio do Prisma.
- **Types:** definem e validam dados de entrada com Zod.
- **Prisma:** define o schema PostgreSQL, as migrations e o client gerado.

O modelo de dados atual contém `Product` e `StockMovement`. Categorias,
fornecedores, funcionários, relatórios e outras entidades não estão
implementados.

## Endpoints da API

| Método | Endpoint | Finalidade |
|---|---|---|
| GET | `/health` | Verificar a disponibilidade da API. |
| POST | `/products` | Cadastrar um produto. |
| GET | `/products` | Listar produtos. |
| GET | `/products/:id` | Consultar um produto por UUID. |
| POST | `/stock-movements` | Registrar uma `ENTRY` ou `EXIT`. |
| GET | `/products/:id/movements` | Consultar o histórico de movimentações. |

A API utiliza `CORS_ORIGINS` para uma lista explícita de origens separadas por
vírgula. O exemplo de desenvolvimento é `http://localhost:5173`. Requisições
sem `Origin` são permitidas para chamadas servidor-servidor e ferramentas de
linha de comando.

## Estrutura do projeto

A estrutura relevante do repositório é:

```text
stockflow/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── controllers/
│   │   │   ├── product.controller.ts
│   │   │   └── stock-movement.controller.ts
│   │   ├── repositories/
│   │   │   ├── product.repository.ts
│   │   │   └── stock-movement.repository.ts
│   │   ├── routes/
│   │   │   ├── product.routes.ts
│   │   │   └── stock-movement.routes.ts
│   │   ├── services/
│   │   │   ├── product.service.ts
│   │   │   └── stock-movement.service.ts
│   │   ├── types/
│   │   │   ├── product.ts
│   │   │   └── stock-movement.ts
│   │   ├── scripts/
│   │   │   └── test-database.ts
│   │   ├── system/
│   │   │   └── stockflow.system.test.ts
│   │   ├── server.ts
│   │   ├── server.test.ts
│   │   ├── products.test.ts
│   │   ├── stock-movement.test.ts
│   │   ├── product.service.unit.test.ts
│   │   └── stock-movement.service.unit.test.ts
│   ├── .env.example
│   ├── package.json
│   ├── prisma7.config.ts
│   ├── tsconfig.json
│   ├── vitest.config.mts
│   └── vitest.system.config.mts
├── docs/
│   └── test-plan/
│       └── plano-de-testes.md
├── frontend/
│   ├── src/
│   └── tests/
├── docker-compose.yml
├── LICENSE
├── README.md
└── README.pt-BR.md
```

Os arquivos gerados do Prisma em `backend/src/generated/prisma` foram omitidos
desse resumo.

## Instalação e execução

### Requisitos

- Node.js 24.
- npm.
- PostgreSQL 16 ou uma instância PostgreSQL de testes compatível.

### Configuração

```bash
git clone https://github.com/Gabriel-c-l/stockflow.git
cd stockflow/backend
npm ci
```

Crie um `.env` local a partir de `.env.example` e configure a conexão
PostgreSQL em `DATABASE_URL`. Mantenha o `.env` local e não o versione. O
exemplo também contém:

```env
PORT=3333
CORS_ORIGINS=http://localhost:5173
```

Prepare um banco PostgreSQL para o backend, gere o client e aplique as
migrations existentes:

```bash
npx prisma generate
npx prisma migrate deploy
```

Inicie a aplicação:

```bash
npm run dev
```

Os comandos para execução em modo de produção são:

```bash
npm run build
npm start
```

A conexão com o banco pode ser verificada com:

```bash
npm run db:test
```

## Testes e qualidade

O projeto registra atualmente 44 testes automatizados:

- 11 testes unitários.
- 23 testes de integração.
- 10 testes de sistema (E2E).

Execute a suíte unitária e de integração com cobertura:

```bash
npm test
```

Execute a suíte de sistema separadamente:

```bash
npm run build
npm run test:system
```

Os níveis de teste têm responsabilidades diferentes:

- Testes unitários isolam componentes e fazem mock dos repositories ou das
  transações Prisma.
- Testes de integração exercitam a API com Supertest e persistência real no
  PostgreSQL.
- Testes de sistema iniciam o servidor compilado como processo independente e
  usam requisições HTTP reais.

Os níveis de cobertura registrados para o projeto são:

| Métrica | Cobertura registrada |
|---|---:|
| Statements | 87,16% |
| Branches | 83,63% |
| Functions | 85,71% |
| Lines | 87,07% |

A configuração do Vitest exige pelo menos 75% nas quatro métricas. O GitHub
Actions automatiza a instalação das dependências, geração do Prisma Client,
migrations, typecheck, build, testes com cobertura e testes de sistema. O
SonarQube Cloud realiza análise estática e verifica o Quality Gate. Nenhuma
métrica do SonarQube é declarada aqui além da análise configurada e dos
resultados documentados pelo processo de qualidade.

Testes de desempenho e usabilidade não são apresentados como concluídos. Essas
atividades ainda precisam ser definidas e executadas no escopo acadêmico.

## Limitações e próximos passos

O projeto está em desenvolvimento e a entrega atual é um backend/API. Os itens
a seguir não estão implementados:

- Autenticação e autorização.
- Gerenciamento de funcionários.
- Fornecedores.
- Categorias.
- Relatórios.
- Monitoramento de estoque baixo.
- Aplicação frontend e interface visual.
- Avaliação formal de desempenho e usabilidade.

Os próximos trabalhos devem definir e implementar os modelos de domínio e
endpoints necessários antes de testá-los, além de atualizar a documentação e o
plano de testes conforme o escopo evoluir.

## Documentação

- [Plano de testes](docs/test-plan/plano-de-testes.md)
- [README em inglês](README.md)
- [README em português](README.pt-BR.md)
- [Workflow do GitHub Actions](.github/workflows/ci.yml)
- [Schema Prisma](backend/prisma/schema.prisma)

## Informações acadêmicas

- **Instituição:** Universidade do Sul de Santa Catarina (UNISUL)
- **Curso:** Análise e Desenvolvimento de Sistemas
- **Unidade curricular:** Garantia e Qualidade de Software
- **Projeto:** A3 — Sistema de Gestão de Estoque
- **Autor:** Gabriel Corrêa Lopes
