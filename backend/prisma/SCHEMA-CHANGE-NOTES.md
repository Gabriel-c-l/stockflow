# StockFlow — atualização do modelo de dados

## Alterações desta etapa

- `Supplier`: cadastro de fornecedores com nome, CPF/CNPJ normalizado, e-mail, telefone, endereço, observações e status ativo.
- `Product.price`: preço atual/de referência do produto, em `DECIMAL(12,2)`, com padrão zero.
- `StockMovement.supplierId`: fornecedor associado a uma entrada, quando aplicável.
- `StockMovement.recipient`: destinatário associado a uma saída, quando aplicável.
- `StockMovement.unitCost`: custo unitário histórico de aquisição, informado em cada entrada quando conhecido.

`Product.price` representa o preço atual do cadastro. `StockMovement.unitCost` representa o custo daquela entrada específica e não deve ser sobrescrito quando o preço do produto mudar.

## Regras de compatibilidade

- Os campos de fornecedor, destinatário e custo histórico são opcionais para preservar movimentos antigos e permitir ajustes de inventário/entradas sem fornecedor identificado.
- Fornecedores são desativados logicamente; não apagamos registros históricos.
- O backend só aceita fornecedor ativo em movimentações ENTRY.
- `supplierId` e `unitCost` não podem ser enviados em EXIT; `recipient` não pode ser enviado em ENTRY.
- Relatórios são derivados das tabelas operacionais. Não duplicar saldos em uma tabela `Report`.

## Aplicação no Windows PowerShell

Faça backup do banco antes de migrar. Na pasta `backend`:

```powershell
npx prisma validate
npx prisma migrate deploy
npx prisma generate
npm run typecheck
npm test
```

A migration anterior `20261126100000_add_supplier_price_movement_metadata` já faz parte do histórico da etapa anterior. Esta atualização acrescenta `20261126120000_add_stock_movement_unit_cost`.

**Não execute `prisma migrate reset`.**
