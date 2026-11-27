# StockFlow — Inventory Management System

[English](README.md) | [Português (Brasil)](README.pt-BR.md)

**Status:** In development — UNISUL academic project.

StockFlow is a web application for inventory management. It combines a React interface, a Node.js/Express API, and a PostgreSQL database managed through Prisma.

## Implemented features

- Database-backed session authentication using an HttpOnly cookie and Argon2id password hashing.
- Per-user language preference: English (`en`) or Brazilian Portuguese (`pt-BR`).
- Product creation, lookup, editing, and soft deactivation.
- Category and supplier creation, lookup, editing, and soft deactivation.
- Stock entries and exits recorded in a movement history.
- Rules preventing negative stock and protecting concurrent exits through conditional updates and PostgreSQL transactions.
- User management with `ADMIN`, `MANAGER`, and `OPERATOR` roles.
- Dashboard metrics, recent movements, entry/exit series, and category distribution.
- Web screens for Dashboard, Inventory, Categories, Stock Movements, Suppliers, Users, and Settings.

The Reports screen is currently a visual placeholder. A complete reporting module, dedicated API, and report persistence have not been implemented.

## Technology stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 24 |
| Language | TypeScript 7 |
| Frontend | React 19, Vite 8 |
| API | Express 5 |
| Database | PostgreSQL 16 |
| ORM and migrations | Prisma 7 |
| Validation | Zod 4 |
| Backend tests | Vitest 5, Supertest |
| CI | GitHub Actions |
| Static analysis | SonarQube Cloud |

## Architecture

The backend separates routes, controllers, services, repositories, middleware, and types. Prisma defines the relational schema and migrations. The frontend separates layout components, UI components, feature screens, and shared libraries.

The relational schema contains six models: `User`, `Session`, `Category`, `Product`, `StockMovement`, and `Supplier`. `StockMovement` represents both entries and exits through the `StockMovementType` enum (`ENTRY`/`EXIT`), avoiding separate tables for the same movement concept.

### Main rules and permissions

- Product SKUs are unique.
- Movement quantities must be positive integers.
- `ENTRY` increases stock; `EXIT` decreases it.
- An exit cannot exceed available stock.
- Stock updates and movement creation run in the same transaction.
- Category, product, and supplier creation, editing, and deactivation require `ADMIN` or `MANAGER`.
- User administration is restricted to `ADMIN`.
- Read and dashboard endpoints require an authenticated session.

## Local setup

### Requirements

- Node.js 24 and npm.
- PostgreSQL 16 or a compatible version.

### Backend

```powershell
cd backend
npm ci
```

Create `backend/.env` from `.env.example` and configure `DATABASE_URL`, `PORT`, and `CORS_ORIGINS`. Do not commit `.env`. Then run:

```powershell
npx prisma generate
npx prisma migrate deploy
npm run dev
```

The API listens on `http://localhost:3333` by default.

### Frontend

In a separate terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Vite listens on `http://localhost:5173` by default. Keep the backend and PostgreSQL running to use the complete application.

## Verification

Backend (`backend/`):

```powershell
npm run typecheck
npm run build
npm test
npm run test:system
```

Frontend (`frontend/`):

```powershell
npm run typecheck
npm run test:run
npm run build
```

GitHub Actions runs backend checks, system tests, and SonarQube Cloud analysis. The frontend has an independent typecheck, test, and build job. Approval of the Quality Gate must be confirmed in the latest workflow run.

## Performance testing

The k6 scripts are located in `backend/performance/`. They require an isolated local database named `stockflow_perf`. Read `backend/performance/README.md` before preparing data, running load, or cleanup commands. Load tests still need to be executed and acceptance thresholds need to be agreed. Never run these scripts against development or production databases.

## Academic documentation

- `docs/requisitos.md`: requirements and implementation status.
- `docs/test-plan/plano-de-testes.md`: test strategy and quality evidence.
- `docs/modelagem/`: use-case, class, sequence, process, and relational-model PlantUML diagrams.
- `docs/banco-de-dados/dicionario-de-dados.md`: data dictionary derived from the schema and migrations.
- `backend/prisma/schema.prisma`: implemented relational model.

The Database course presentation still needs to be prepared. Diagrams must be rendered and visually reviewed. Usability and performance evidence also needs to be collected before the A3 submissions.
