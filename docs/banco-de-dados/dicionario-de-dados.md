# Dicionário de Dados — StockFlow

**Fonte:** `backend/prisma/schema.prisma` e migrations versionadas em
`backend/prisma/migrations/`.

**SGBD:** PostgreSQL. **Schema:** `public`.

Este documento descreve o modelo relacional implementado. Os tipos abaixo
refletem os tipos PostgreSQL criados pelas migrations atuais; `UUID` é gerado
pela aplicação/Prisma, salvo indicação diferente. Campos `DateTime` usam
`TIMESTAMP(3)` no schema atual.

## 1. Visão geral das entidades

| Entidade/tabela | Finalidade | Chave primária |
|---|---|---|
| `User` | Usuários/funcionários, credenciais, perfil e idioma | `id` |
| `Session` | Sessões autenticadas, validade e revogação | `id` |
| `Category` | Classificação dos produtos | `id` |
| `Product` | Cadastro de produtos e saldo atual | `id` |
| `StockMovement` | Histórico unificado de entradas e saídas | `id` |
| `Supplier` | Cadastro de fornecedores | `id` |

## 2. Dicionário por tabela

### 2.1 `User` — usuários/funcionários

Armazena as pessoas que acessam o sistema. A senha nunca é armazenada em texto
puro; `passwordHash` recebe o hash Argon2id produzido pela aplicação.

| Campo | Tipo PostgreSQL | Nulo? | Default | Chave/regra/descrição |
|---|---|---:|---|---|
| `id` | `UUID` | Não | Gerado pelo Prisma | PK; identificador do usuário |
| `name` | `TEXT` | Não | — | Nome da pessoa |
| `email` | `TEXT` | Não | — | UNIQUE; e-mail de acesso |
| `passwordHash` | `TEXT` | Não | — | Hash Argon2id da senha |
| `role` | `UserRole` | Não | `OPERATOR` | Perfil: `ADMIN`, `MANAGER` ou `OPERATOR` |
| `language` | `VARCHAR(5)` | Não | `en` | Preferência: `en` ou `pt-BR` |
| `isActive` | `BOOLEAN` | Não | `true` | Indica se o usuário está ativo |
| `createdAt` | `TIMESTAMP(3)` | Não | `CURRENT_TIMESTAMP` | Data/hora de criação |
| `updatedAt` | `TIMESTAMP(3)` | Não | Gerenciado pelo Prisma | Data/hora da última atualização (`@updatedAt`) |

### 2.2 `Session` — sessões

Armazena sessões associadas a um usuário. O token original não é persistido;
apenas seu hash é armazenado.

| Campo | Tipo PostgreSQL | Nulo? | Default | Chave/regra/descrição |
|---|---|---:|---|---|
| `id` | `UUID` | Não | Gerado pelo Prisma | PK; identificador da sessão |
| `userId` | `UUID` | Não | — | FK → `User.id`; dono da sessão |
| `tokenHash` | `TEXT` | Não | — | UNIQUE; hash do token da sessão |
| `expiresAt` | `TIMESTAMP(3)` | Não | — | Data/hora de expiração |
| `revokedAt` | `TIMESTAMP(3)` | Sim | `NULL` | Data/hora da revogação; nulo enquanto não revogada |
| `createdAt` | `TIMESTAMP(3)` | Não | `CURRENT_TIMESTAMP` | Data/hora de criação |

### 2.3 `Category` — categorias

Classifica produtos. A desativação é lógica, para preservar referências
históricas.

| Campo | Tipo PostgreSQL | Nulo? | Default | Chave/regra/descrição |
|---|---|---:|---|---|
| `id` | `UUID` | Não | Gerado pelo Prisma | PK |
| `name` | `TEXT` | Não | — | UNIQUE; nome da categoria |
| `description` | `TEXT` | Sim | `NULL` | Descrição opcional |
| `isActive` | `BOOLEAN` | Não | `true` | Situação da categoria |
| `createdAt` | `TIMESTAMP(3)` | Não | `CURRENT_TIMESTAMP` | Data/hora de criação |
| `updatedAt` | `TIMESTAMP(3)` | Não | Gerenciado pelo Prisma | Data/hora da última atualização (`@updatedAt`) |

### 2.4 `Product` — produtos

Mantém os dados de identificação, classificação, preço e saldo atual. O saldo
deve ser alterado por movimentações, não por edição direta do cadastro.

| Campo | Tipo PostgreSQL | Nulo? | Default | Chave/regra/descrição |
|---|---|---:|---|---|
| `id` | `UUID` | Não | Gerado pelo Prisma | PK |
| `sku` | `TEXT` | Não | — | UNIQUE; código de identificação do produto |
| `name` | `TEXT` | Não | — | Nome do produto |
| `description` | `TEXT` | Sim | `NULL` | Descrição opcional |
| `price` | `DECIMAL(12,2)` | Não | `0` | Preço unitário; CHECK `price >= 0` |
| `quantity` | `INTEGER` | Não | `0` | Saldo atual em estoque |
| `minStock` | `INTEGER` | Não | `0` | Limite mínimo de estoque |
| `isActive` | `BOOLEAN` | Não | `true` | Situação do produto |
| `createdAt` | `TIMESTAMP(3)` | Não | `CURRENT_TIMESTAMP` | Data/hora de criação |
| `updatedAt` | `TIMESTAMP(3)` | Não | Gerenciado pelo Prisma | Data/hora da última atualização (`@updatedAt`) |
| `categoryId` | `UUID` | Sim | `NULL` | FK → `Category.id`; categoria do produto |
| `unit` | `TEXT` | Não | `UN` | Unidade de medida |
| `location` | `TEXT` | Sim | `NULL` | Localização física opcional |

### 2.5 `StockMovement` — movimentações de estoque

Registra entradas e saídas em uma única tabela. O campo `type` determina o tipo
da movimentação. Atualização do saldo e criação do histórico são executadas na
mesma transação de banco.

| Campo | Tipo PostgreSQL | Nulo? | Default | Chave/regra/descrição |
|---|---|---:|---|---|
| `id` | `UUID` | Não | Gerado pelo Prisma | PK |
| `productId` | `UUID` | Não | — | FK → `Product.id`; produto movimentado |
| `performedById` | `UUID` | Sim | `NULL` | FK → `User.id`; usuário responsável, quando associado |
| `type` | `StockMovementType` | Não | — | `ENTRY` ou `EXIT` |
| `quantity` | `INTEGER` | Não | — | Quantidade movimentada; CHECK `quantity > 0` |
| `supplierId` | `UUID` | Sim | `NULL` | FK → `Supplier.id`; fornecedor, quando aplicável |
| `unitCost` | `DECIMAL(12,2)` | Sim | `NULL` | Custo unitário opcional; CHECK nulo ou `>= 0` |
| `recipient` | `TEXT` | Sim | `NULL` | Destinatário associado à saída |
| `notes` | `TEXT` | Sim | `NULL` | Observações opcionais |
| `createdAt` | `TIMESTAMP(3)` | Não | `CURRENT_TIMESTAMP` | Data/hora da movimentação |

### 2.6 `Supplier` — fornecedores

Armazena os dados de contato dos fornecedores. A desativação é lógica, mantendo
a possibilidade de consultar movimentações antigas.

| Campo | Tipo PostgreSQL | Nulo? | Default | Chave/regra/descrição |
|---|---|---:|---|---|
| `id` | `UUID` | Não | Gerado pelo Prisma | PK |
| `name` | `TEXT` | Não | — | Nome do fornecedor |
| `taxId` | `TEXT` | Sim | `NULL` | UNIQUE quando informado; identificador fiscal |
| `email` | `TEXT` | Sim | `NULL` | E-mail de contato |
| `phone` | `TEXT` | Sim | `NULL` | Telefone de contato |
| `address` | `TEXT` | Sim | `NULL` | Endereço |
| `notes` | `TEXT` | Sim | `NULL` | Observações |
| `isActive` | `BOOLEAN` | Não | `true` | Situação do fornecedor |
| `createdAt` | `TIMESTAMP(3)` | Não | `CURRENT_TIMESTAMP` | Data/hora de criação |
| `updatedAt` | `TIMESTAMP(3)` | Não | Gerenciado pelo Prisma | Data/hora da última atualização (`@updatedAt`) |

## 3. Tipos enumerados

### `UserRole`

| Valor | Significado |
|---|---|
| `ADMIN` | Administrador; pode administrar usuários |
| `MANAGER` | Gestor; pode manter produtos, categorias e fornecedores |
| `OPERATOR` | Operador; executa as operações operacionais permitidas |

### `StockMovementType`

| Valor | Efeito no saldo |
|---|---|
| `ENTRY` | Aumenta `Product.quantity` |
| `EXIT` | Diminui `Product.quantity`, sem permitir saldo negativo |

## 4. Relacionamentos e integridade referencial

| Origem | Cardinalidade | Destino | Regra |
|---|---|---|---|
| `Session.userId` | N:1 obrigatório | `User.id` | Uma sessão pertence a um usuário; um usuário pode possuir várias sessões |
| `Product.categoryId` | N:1 opcional | `Category.id` | Um produto pode não ter categoria; uma categoria pode classificar vários produtos |
| `StockMovement.productId` | N:1 obrigatório | `Product.id` | Cada movimentação pertence a um produto |
| `StockMovement.performedById` | N:1 opcional | `User.id` | Uma movimentação pode registrar o usuário responsável |
| `StockMovement.supplierId` | N:1 opcional | `Supplier.id` | Uma movimentação pode referenciar um fornecedor |

As migrations definem as FKs com `ON DELETE RESTRICT` e `ON UPDATE CASCADE`.
Isso impede apagar fisicamente registros referenciados e favorece a
preservação do histórico. O sistema usa desativação lógica para entidades de
cadastro quando aplicável.

## 5. Índices e restrições adicionais

| Tabela | Índice/restrição | Colunas | Finalidade |
|---|---|---|---|
| `User` | PK | `id` | Identificação única |
| `User` | UNIQUE | `email` | Impedir e-mails repetidos |
| `Session` | PK | `id` | Identificação única |
| `Session` | UNIQUE | `tokenHash` | Impedir hashes de sessão repetidos |
| `Session` | INDEX | `userId` | Localizar sessões de um usuário |
| `Session` | INDEX | `expiresAt` | Apoiar consultas por expiração |
| `Category` | PK | `id` | Identificação única |
| `Category` | UNIQUE | `name` | Impedir categorias com o mesmo nome |
| `Product` | PK | `id` | Identificação única |
| `Product` | UNIQUE | `sku` | Impedir SKU repetido |
| `Product` | INDEX | `categoryId` | Consultar produtos por categoria |
| `Product` | INDEX | `isActive`, `name` | Apoiar listagem por situação/nome |
| `Product` | CHECK | `price >= 0` | Impedir preço negativo |
| `StockMovement` | PK | `id` | Identificação única |
| `StockMovement` | INDEX | `productId`, `createdAt` | Consultar histórico por produto e data |
| `StockMovement` | INDEX | `performedById` | Consultar movimentações por responsável |
| `StockMovement` | INDEX | `supplierId` | Consultar movimentações por fornecedor |
| `StockMovement` | INDEX | `type`, `createdAt` | Consultar movimentações por tipo e data |
| `StockMovement` | CHECK | `quantity > 0` | Impedir quantidades nulas/negativas |
| `StockMovement` | CHECK | `unitCost IS NULL OR unitCost >= 0` | Impedir custo unitário negativo |
| `Supplier` | PK | `id` | Identificação única |
| `Supplier` | UNIQUE | `taxId` | Impedir identificador fiscal repetido quando preenchido |
| `Supplier` | INDEX | `name` | Apoiar busca por nome |
| `Supplier` | INDEX | `isActive`, `name` | Apoiar listagem por situação/nome |

## 6. Regras de negócio relacionadas ao modelo

1. `sku` de produto é obrigatório e único.
2. `Product.quantity` representa o saldo atual e deve ser alterado por
   movimentações.
3. `StockMovement.quantity` deve ser positivo.
4. `ENTRY` acrescenta unidades ao saldo; `EXIT` subtrai unidades.
5. Uma saída não pode fazer o saldo ficar negativo.
6. Atualização do saldo e registro de `StockMovement` pertencem à mesma
   transação.
7. O perfil do usuário determina as permissões de manutenção dos cadastros.
8. Senhas são armazenadas como hash Argon2id; tokens de sessão são armazenados
   como hash, não em formato original.

## 7. Decisões de modelagem

- Entradas e saídas compartilham `StockMovement`, diferenciadas por
  `StockMovementType`; não existem tabelas separadas `Entry` e `Exit`.
- Usuários/funcionários são representados por `User`, que combina identidade,
  credenciais e perfil de acesso. Não existe tabela `Employee` separada.
- Dashboard e indicadores são calculados a partir dos produtos e movimentações;
  não há tabela `Report` no schema atual. A tela de Relatórios permanece
  incompleta e precisa de escopo definido antes de implementar novos objetos.
- `Session` é separada de `User` para permitir múltiplas sessões, expiração e
  revogação sem armazenar o token de autenticação em texto puro.

## 8. Como manter o documento

Ao alterar `backend/prisma/schema.prisma` ou uma migration, revisar este
arquivo. O schema e as migrations são a fonte técnica de verdade; este
Dicionário de Dados é o artefato descritivo para a entrega acadêmica e não
substitui o banco nem as migrations.
