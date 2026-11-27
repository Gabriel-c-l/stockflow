# Modelagem do StockFlow

Este diretório reúne os diagramas UML e o fluxo operacional do StockFlow. A
modelagem foi conferida com o schema Prisma, as rotas, os controllers, os
services, os repositories e os requisitos documentados na versão atual.

## Diagramas

| Arquivo | Objetivo | Situação |
|---|---|---|
| [casos-de-uso.puml](casos-de-uso.puml) | Mostra os três perfis, autenticação, operações de inventário e administração | Atualizado conforme as permissões das rotas |
| [classes.puml](classes.puml) | Representa os seis modelos persistidos e os dois enums do Prisma | Atualizado conforme `backend/prisma/schema.prisma` |
| [modelo-relacional.puml](modelo-relacional.puml) | Mostra as entidades, PKs, FKs e cardinalidades do banco relacional | Atualizado conforme schema e migrations |
| [sequencia-saida-estoque.puml](sequencia-saida-estoque.puml) | Detalha uma saída, a transação e os caminhos de sucesso/erro | Mantido como diagrama de sequência específico |
| [processo-gestao-estoque.puml](processo-gestao-estoque.puml) | Representa cadastro, entrada, saída e concorrência em raias | Diagrama de atividade PlantUML; não é BPMN 2.0 formal |

## Modelo de dados

O schema atual possui seis modelos: `User`, `Session`, `Category`, `Product`,
`StockMovement` e `Supplier`. Entradas e saídas são armazenadas em
`StockMovement` e diferenciadas pelo enum `StockMovementType` (`ENTRY` e
`EXIT`). Os perfis são definidos por `UserRole` (`ADMIN`, `MANAGER` e
`OPERATOR`).

O dicionário de dados está em
[`../banco-de-dados/dicionario-de-dados.md`](../banco-de-dados/dicionario-de-dados.md)
e foi construído a partir do schema Prisma e das migrations versionadas.

## Permissões representadas

- Todos os perfis autenticados podem consultar produtos, categorias,
  fornecedores, dashboard e movimentações, e registrar entradas/saídas.
- `ADMIN` e `MANAGER` podem criar, editar e desativar produtos, categorias e
  fornecedores.
- Somente `ADMIN` pode administrar usuários.
- O usuário autenticado pode encerrar sua sessão e alterar a preferência de
  idioma.
- Relatórios avançados ainda não estão implementados; o item permanece como
  funcionalidade futura e não é representado como endpoint existente.

## Notação e limites

- Os diagramas de classes e entidade-relacionamento representam os modelos
  persistidos, não os DTOs, controllers ou serviços internos.
- `?` identifica atributo opcional/nulo no modelo.
- `1`, `0..1` e `0..*` representam cardinalidades dos relacionamentos.
- O diagrama de processo usa raias e elementos de atividade do PlantUML. Ele
  ajuda a explicar o fluxo, mas não substitui um modelo BPMN 2.0 validado.
- A existência de um requisito ou caso de uso no documento não significa que
  a funcionalidade esteja implementada. O status é indicado explicitamente.

## Visualização

Os arquivos `.puml` podem ser visualizados pela extensão PlantUML no VS Code,
por um aplicativo/servidor PlantUML ou por um renderizador local configurado.
Cada diagrama deve ser renderizado separadamente. O modelo relacional e o
diagrama de classes são visões complementares do mesmo schema.
