# StockFlow — Sistema de Gestão de Estoque

[English](README.md) | [Português (Brasil)](README.pt-BR.md)

**Status:** Em desenvolvimento — projeto acadêmico da UNISUL.

O StockFlow é uma aplicação web para gestão de estoque. A solução reúne uma interface React, uma API Node.js/Express e um banco PostgreSQL gerenciado pelo Prisma.

## Funcionalidades implementadas

- Autenticação por sessão persistida no PostgreSQL, com cookie HttpOnly e senha armazenada com Argon2id.
- Preferência de idioma por usuário: inglês (`en`) ou português brasileiro (`pt-BR`).
- Cadastro, consulta, edição e desativação lógica de produtos.
- Categorias e fornecedores, com operações de cadastro, consulta, edição e desativação lógica.
- Entradas e saídas de estoque registradas no histórico de movimentações.
- Regras que impedem estoque negativo e protegem saídas concorrentes por atualização condicional e transação no PostgreSQL.
- Gestão de usuários e perfis `ADMIN`, `MANAGER` e `OPERATOR`.
- Dashboard com indicadores, movimentações recentes, série de entradas/saídas e distribuição por categoria.
- Interface web com Dashboard, Inventário, Categorias, Movimentações, Fornecedores, Usuários e Configurações.

A tela de Relatórios existe como placeholder visual; não há ainda um módulo completo de relatórios, API específica ou persistência de relatórios.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 24 |
| Linguagem | TypeScript 7 |
| Frontend | React 19, Vite 8 |
| API | Express 5 |
| Banco de dados | PostgreSQL 16 |
| ORM e migrações | Prisma 7 |
| Validação | Zod 4 |
| Testes backend | Vitest 5, Supertest |
| CI | GitHub Actions |
| Análise estática | SonarQube Cloud |

## Arquitetura

O backend separa rotas, controllers, services, repositories, middlewares e tipos. O Prisma define o schema relacional e as migrações. O frontend separa componentes de layout, componentes de UI, funcionalidades e bibliotecas compartilhadas.

O schema relacional possui seis modelos: `User`, `Session`, `Category`, `Product`, `StockMovement` e `Supplier`. `StockMovement` representa tanto entradas quanto saídas por meio do enum `StockMovementType` (`ENTRY`/`EXIT`), evitando tabelas duplicadas para o mesmo conceito de movimentação.

### Regras e permissões principais

- O SKU do produto é único.
- Quantidades de movimentação devem ser inteiros positivos.
- `ENTRY` aumenta o saldo; `EXIT` reduz o saldo.
- Uma saída não pode exceder o saldo disponível.
- Atualização do saldo e criação da movimentação ocorrem na mesma transação.
- Categorias, produtos e fornecedores exigem `ADMIN` ou `MANAGER` para criação, edição e desativação.
- A gestão de usuários é restrita a `ADMIN`.
- Os endpoints de leitura e dashboard exigem sessão autenticada.

## Execução local

### Requisitos

- Node.js 24 e npm.
- PostgreSQL 16 ou versão compatível.

### Backend

```powershell
cd backend
npm ci
```

Crie `backend/.env` a partir de `.env.example` e configure `DATABASE_URL`, `PORT` e `CORS_ORIGINS`. Não versione o `.env`. Depois execute:

```powershell
npx prisma generate
npx prisma migrate deploy
npm run dev
```

A API inicia, por padrão, em `http://localhost:3333`.

### Frontend

Em outro terminal:

```powershell
cd frontend
npm ci
npm run dev
```

O Vite inicia, por padrão, em `http://localhost:5173`. Para usar a aplicação completa, mantenha o backend e o PostgreSQL em execução.

## Verificações

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

O workflow do GitHub Actions executa as verificações do backend, testes de sistema e análise SonarQube Cloud. O frontend também possui um job independente de typecheck, testes e build. A aprovação final do Quality Gate deve ser confirmada na execução mais recente do workflow.

## Testes de desempenho

Os scripts k6 estão em `backend/performance/`. Eles usam exclusivamente um banco local isolado chamado `stockflow_perf`. Consulte `backend/performance/README.md` antes de executar qualquer preparação, carga ou limpeza. Os testes de carga ainda precisam ser executados e seus critérios de aceitação precisam ser definidos. Nunca execute esses scripts contra o banco de desenvolvimento ou produção.

## Documentação acadêmica

- `docs/requisitos.md`: requisitos e situação de implementação.
- `docs/test-plan/plano-de-testes.md`: estratégia e evidências de qualidade.
- `docs/modelagem/`: diagramas de casos de uso, classes, sequência, processo e modelo relacional em PlantUML.
- `docs/banco-de-dados/dicionario-de-dados.md`: dicionário de dados derivado do schema e das migrations.
- `backend/prisma/schema.prisma`: modelo relacional implementado.

A apresentação específica da UC Banco de Dados ainda precisa ser preparada. Os diagramas devem ser renderizados e conferidos visualmente. As evidências de usabilidade e desempenho também precisam ser coletadas antes da entrega final das A3.
