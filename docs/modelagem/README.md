# Modelagem do StockFlow

Este diretório reúne a modelagem UML e BPM da entrega atual da API StockFlow.
Os diagramas foram derivados do documento [Requisitos do StockFlow](../requisitos.md),
do schema Prisma, das rotas, dos controllers, dos services e dos repositories
implementados no backend.

## Diagramas

| Arquivo | Objetivo |
|---|---|
| [casos-de-uso.puml](casos-de-uso.puml) | Representa os atores conceituais e os casos de uso implementados, além do relatório como funcionalidade futura |
| [classes.puml](classes.puml) | Representa as entidades reais `Product`, `StockMovement` e `StockMovementType` |
| [sequencia-saida-estoque.puml](sequencia-saida-estoque.puml) | Representa o fluxo real de registro de uma saída, incluindo a transação e os caminhos de sucesso e insuficiência |
| [processo-gestao-estoque.puml](processo-gestao-estoque.puml) | Representa o processo de gestão de estoque em raias operacionais |

## Relação com os requisitos

- RF01–RF06 correspondem aos casos de uso implementados.
- RF07 corresponde ao relatório de inventário, representado apenas como futura
  funcionalidade.
- RN01–RN12 fundamentam os atributos, decisões e regras dos diagramas.
- RNF04 fundamenta a transação e o tratamento de saídas concorrentes.
- CA10, CA14 e CA15 fundamentam os caminhos alternativos de saída insuficiente
  e concorrência.

Os atores são conceituais. Não há autenticação, perfis ou permissões
implementadas na API atual.

## Legenda e notação

- Ator: participante externo representado por `actor`.
- Caso de uso: funcionalidade executada pela API.
- Implementado: comportamento coberto pela entrega atual.
- Futuro/não implementado: requisito solicitado, mas sem suporte no código.
- Relação simples entre as classes: `1` para `Product`; `0..*` para
  múltiplas movimentações associadas a ele.
-- Processo: retângulo para atividade, losango para decisão, círculo para
  início/fim e raias para a responsabilidade de cada participante. As raias do
  PlantUML representam o processo visualmente, mas não configuram uma
  implementação formal de BPMN 2.0.

## Visualização

Os arquivos usam extensão `.puml` e podem ser visualizados em:

- extensão PlantUML no VS Code;
- site ou aplicativo PlantUML que aceite texto `.puml`;
- servidor PlantUML ou renderizador local configurado pelo ambiente.

Os arquivos podem ser renderizados separadamente, por exemplo:

```text
casos-de-uso.puml
classes.puml
sequencia-saida-estoque.puml
processo-gestao-estoque.puml
```

Nenhum desses arquivos altera o backend ou cria entidades adicionais no sistema.
