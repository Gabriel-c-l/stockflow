# Implementação — fornecedores, preços e movimentações

Esta entrega adiciona a primeira parte da evolução do backend:

1. API autenticada de fornecedores (`/suppliers`): POST, GET, GET por ID, PATCH e DELETE lógico.
2. Validação de CPF/CNPJ por quantidade de dígitos e normalização para armazenar somente números. A validação não substitui a verificação matemática dos dígitos verificadores.
3. `price` no cadastro/edição de produto, com padrão `0` e bloqueio de valores negativos.
4. `supplierId`, `recipient` e `unitCost` nas movimentações.
5. Custo histórico da entrada em `StockMovement.unitCost`, sem alterar o preço atual do produto.
6. Validação de fornecedor ativo nas entradas e rejeição de fornecedor/custo em saídas ou destinatário em entradas.
7. Testes unitários iniciais para o dashboard e serviço de fornecedores.

## Antes de testar

A migration de custo histórico precisa ser aplicada e o Prisma Client regenerado. O cliente gerado incluído no ZIP de origem está desatualizado em relação ao novo campo `unitCost`.

```powershell
npx prisma validate
npx prisma migrate deploy
npx prisma generate
npm run typecheck
npm test
```

A execução automatizada deste pacote foi parcialmente limitada pelo ambiente Linux usado para preparar a alteração: a dependência nativa do Vitest não está disponível aqui. O typecheck foi verificado até o ponto em que o Prisma Client antigo passou a divergir do schema por causa de `unitCost`; a regeneração no ambiente Windows é necessária antes da validação final.

## Endpoints

- `GET /suppliers?status=active|inactive|all`
- `POST /suppliers`
- `GET /suppliers/:id`
- `PATCH /suppliers/:id`
- `DELETE /suppliers/:id` (desativação lógica)

Os endpoints exigem autenticação, como as demais rotas de cadastro.

## Exemplo de movimentação

Entrada:

```json
{
  "productId": "UUID_DO_PRODUTO",
  "type": "ENTRY",
  "quantity": 10,
  "supplierId": "UUID_DO_FORNECEDOR",
  "unitCost": 18.9,
  "notes": "Compra de reposição"
}
```

Saída:

```json
{
  "productId": "UUID_DO_PRODUTO",
  "type": "EXIT",
  "quantity": 2,
  "recipient": "Setor de manutenção",
  "notes": "Consumo interno"
}
```

Fornecedor e destinatário permanecem opcionais nesta fase para compatibilidade com movimentos antigos e ajustes de estoque. A interface deverá orientar o preenchimento conforme o tipo de movimentação.
