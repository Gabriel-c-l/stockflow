# StockFlow — Inventory Management API

[English](README.md) | [Português (Brasil)](README.pt-BR.md)

**Status:** In development

StockFlow is an academic inventory management project developed for the
Software Quality Assurance course at UNISUL. The current delivery is a
backend/API in development, focused on products and stock movements.

## Features

The currently implemented API provides:

- Health check with `GET /health`.
- Product creation with `POST /products`.
- Product listing with `GET /products`.
- Product lookup by ID with `GET /products/:id`.
- Stock entries and exits with `POST /stock-movements`.
- Product movement history with `GET /products/:id/movements`.

The `frontend/` directory exists only as an initial project structure; no
frontend functionality is implemented in the current delivery.

### Business rules

- SKU is unique.
- Required fields are validated.
- Movement quantity must be a positive integer.
- `ENTRY` movements increase available stock.
- `EXIT` movements decrease available stock.
- An exit cannot exceed available stock.
- Product balance updates and movement registration occur in the same database
  transaction.
- Movement history is preserved.

## Technology stack

| Area | Technology |
|---|---|
| Runtime | Node.js 24 |
| Language | TypeScript 7.0.2 |
| API | Express 5.3.0 |
| Database | PostgreSQL 16 |
| ORM and migrations | Prisma 7.10.1 |
| Validation | Zod 4.6.7 |
| Unit and integration tests | Vitest 5.1.0 |
| HTTP integration tests | Supertest 7.3.2 |
| Continuous integration | GitHub Actions |
| Static analysis | SonarQube Cloud |

Additional backend dependencies include `cors`, `dotenv`, `pg`,
`@prisma/adapter-pg`, and the generated Prisma Client.

## Architecture

The backend follows a layered structure:

- **Routes:** map HTTP paths and methods to controllers.
- **Controllers:** parse requests, call services and build HTTP responses.
- **Services:** contain business rules and transaction orchestration.
- **Repositories:** access Products and StockMovements through Prisma.
- **Types:** define and validate request data with Zod.
- **Prisma:** defines the PostgreSQL schema, migrations and generated client.

The current data model contains `Product` and `StockMovement`. Categories,
suppliers, employees, reports and other entities are not implemented.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check API availability. |
| POST | `/products` | Create a product. |
| GET | `/products` | List products. |
| GET | `/products/:id` | Get a product by UUID. |
| POST | `/stock-movements` | Register an `ENTRY` or `EXIT`. |
| GET | `/products/:id/movements` | Get a product movement history. |

The API uses `CORS_ORIGINS` for an explicit comma-separated allowlist. The
development example is `http://localhost:5173`. Requests without an `Origin`
are allowed for server-to-server calls and command-line tools.

## Project structure

The relevant repository structure is:

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

Generated Prisma Client files under `backend/src/generated/prisma` are omitted
from this summary.

## Installation and execution

### Requirements

- Node.js 24.
- npm.
- PostgreSQL 16 or a compatible PostgreSQL test instance.

### Setup

```bash
git clone https://github.com/Gabriel-c-l/stockflow.git
cd stockflow/backend
npm ci
```

Create a local `.env` from `.env.example` and configure the PostgreSQL
connection in `DATABASE_URL`. Keep `.env` local and do not commit it. The
example also contains:

```env
PORT=3333
CORS_ORIGINS=http://localhost:5173
```

Prepare a PostgreSQL database for the backend, then generate the client and
apply the existing migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

Start the application:

```bash
npm run dev
```

The production-style commands are:

```bash
npm run build
npm start
```

The database connection can be checked with:

```bash
npm run db:test
```

## Tests and quality

The project currently reports 44 automated tests:

- 11 unit tests.
- 23 integration tests.
- 10 system tests (E2E).

Run the unit and integration suite with coverage:

```bash
npm test
```

Run the system suite separately:

```bash
npm run build
npm run test:system
```

The testing levels have different responsibilities:

- Unit tests isolate components and mock repositories or Prisma transactions.
- Integration tests exercise the API with Supertest and real PostgreSQL
  persistence.
- System tests start the compiled server as an independent process and use
  real HTTP requests.

The coverage levels recorded for the project are:

| Metric | Recorded coverage |
|---|---:|
| Statements | 87.16% |
| Branches | 83.63% |
| Functions | 85.71% |
| Lines | 87.07% |

The Vitest configuration requires at least 75% for all four metrics. GitHub
Actions automates dependency installation, Prisma generation, migrations,
typecheck, build, coverage tests and system tests. SonarQube Cloud performs
static analysis and evaluates the Quality Gate. No SonarQube metric values are
claimed here beyond the configured analysis and the results documented by the
quality process.

Performance and usability tests have not been declared as completed. They
remain activities to be defined and executed for the academic scope.

## Limitations and next steps

The project is in development and the current delivery is a backend/API.
The following items are not implemented:

- Authentication and authorization.
- Employee management.
- Suppliers.
- Categories.
- Reports.
- Low-stock monitoring.
- Frontend application and visual interface.
- Formal performance and usability evaluation.

Future work should define and implement the required domain models and
endpoints before testing them, and should update the documentation and test
plan as the scope evolves.

## Documentation

- [Test plan](docs/test-plan/plano-de-testes.md)
- [English README](README.md)
- [Portuguese README](README.pt-BR.md)
- [GitHub Actions workflow](.github/workflows/ci.yml)
- [Prisma schema](backend/prisma/schema.prisma)

## Academic information

- **Institution:** Universidade do Sul de Santa Catarina (UNISUL)
- **Course:** Systems Analysis and Development
- **Subject:** Software Quality Assurance
- **Project:** A3 — Inventory Management System
- **Author:** Gabriel Corrêa Lopes
