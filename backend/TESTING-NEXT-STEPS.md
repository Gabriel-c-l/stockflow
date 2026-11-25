# StockFlow backend — cobertura e auditoria

## Alterações desta entrega

Foram adicionados testes unitários para:
- Controller de categorias: criação, validação, listagem por status, consulta, atualização, desativação e mapeamento de erros HTTP.
- Service de categorias: erros Prisma P2002/P2025, categoria inexistente/em uso, atualização, desativação e validação de vínculo ativo.
- Controller de autenticação: login válido/inválido, credenciais rejeitadas, erro inesperado, logout com/sem cookie e endpoint `/me`.
- Rate limit de login: limite de cinco tentativas, bloqueio, expiração da janela, IPs separados e reset após login bem-sucedido.

## Validar no Windows/PowerShell

Na pasta `backend`:

```powershell
npm run typecheck
npm test
npm run build
npm run test:system
```

O limite global de branches continua em 75%; não foi reduzido.

## Investigar vulnerabilidades

Executar e compartilhar a saída completa:

```powershell
npm audit
npm audit --json > npm-audit.json
npm audit --omit=dev
```

Não executar `npm audit fix --force`. Primeiro precisamos identificar os pacotes afetados, versões instaladas, se são dependências diretas/transitivas e se há correção compatível. Depois podemos aplicar atualizações pontuais e repetir testes/build.
