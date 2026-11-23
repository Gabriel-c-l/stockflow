# Testes de desempenho - StockFlow

Esta pasta contém a estrutura planejada para avaliar o desempenho da API
StockFlow. Os testes ainda não foram executados.

Os critérios quantitativos de tempo de resposta, throughput e escalabilidade
não estão definidos neste documento e precisam ser confirmados com o professor.
Nenhum threshold ou limite de aprovação é configurado.

## Pré-requisitos

- Node.js 24 e npm.
- PostgreSQL local.
- Banco exclusivo `stockflow_perf`.
- k6 instalado separadamente na máquina de teste.
- Dependências já instaladas no backend.
- API compilada e iniciada localmente.

Não execute carga contra o banco de desenvolvimento, integração, sistema ou
produção.

## Banco isolado

Crie um PostgreSQL local com um banco chamado exatamente `stockflow_perf`. A
mesma conexão deve ser atribuída explicitamente às duas variáveis:

- `PERF_DATABASE_URL`: preparação e limpeza Node/Prisma.
- `DATABASE_URL`: Prisma CLI e API iniciada para os testes.

Exemplo de formato, sem credenciais reais:

```text
PERF_DATABASE_URL=postgresql://USUARIO:SENHA@localhost:5432/stockflow_perf
```

Não coloque essa URL ou sua senha em arquivos versionados. Configure a variável
no terminal ou em um arquivo `.env` local não versionado.

Os scripts de preparação e limpeza verificam:

- existência explícita de `PERF_DATABASE_URL`;
- banco atual igual a `stockflow_perf`;
- conexão a um host local;
- prefixo `PERF-` em cada SKU criado;
- identificadores registrados pertencentes à execução.

Falhas nessas verificações interrompem o processo antes de operações
destrutivas.

## Preparação da massa

Os volumes abaixo são cenários experimentais, não critérios de aceitação:

- 100 produtos;
- 500 produtos;
- 1.000 produtos.

Na pasta `backend`, configure `PERF_DATABASE_URL` e `DATABASE_URL` com o mesmo
valor antes de qualquer operação Prisma ou inicialização da API. Confirme que
a URL termina em `/stockflow_perf`.

Exemplo no PowerShell:

```powershell
$performanceUrl = "postgresql://USUARIO:SENHA@127.0.0.1:5432/stockflow_perf"
$env:PERF_DATABASE_URL = $performanceUrl
$env:DATABASE_URL = $performanceUrl
```

Gere o Prisma Client e aplique as migrations exclusivamente no banco
`stockflow_perf`:

```bash
npx prisma generate
npx prisma migrate deploy
```

Não execute migração ou API enquanto `DATABASE_URL` puder apontar para outro
banco. Interrompa o processo se o banco conectado não for `stockflow_perf`.

Depois, execute a preparação informando o volume:

```bash
cd backend/performance
npx tsx scripts/prepare-data.ts --count 100
npx tsx scripts/prepare-data.ts --count 500
npx tsx scripts/prepare-data.ts --count 1000
```

Cada preparação cria um identificador exclusivo, SKUs iniciados por
`PERF-<run-id>-`, produtos sintéticos com saldo suficiente e um registro
JSON em `results/performance-run.json`.

O registro contém o run ID, prefixo, IDs de consulta e IDs de movimentação.
Não contém usuário, senha ou a URL completa da conexão.

Os SKUs usados por `POST /products` são gerados pelo k6 com base no run ID,
VU e iteração. O volume preparado representa os dados existentes usados para
consultas e movimentações.

## Aquecimento e níveis

Cada script k6 usa o executor `ramping-vus`:

1. ramp-up de 10 segundos até 1 VU e manutenção por 60 segundos;
2. ramp-up de 10 segundos até 5 VUs e manutenção por 60 segundos;
3. ramp-up de 10 segundos até 10 VUs e manutenção por 60 segundos;
4. ramp-up de 10 segundos até 25 VUs e manutenção por 60 segundos;
5. ramp-up de 10 segundos até 50 VUs e manutenção por 60 segundos;
6. ramp-down controlado de 10 segundos até 0 VUs.

As estimativas acima são variações experimentais e não metas de aprovação.
As fases de aquecimento não substituem nem contam como medição estável.

O aquecimento atual consulta apenas `/health` por 30 segundos. Ele mede
estabilização básica da API, não o desempenho do endpoint alvo. Para aquecer um
endpoint específico, use uma execução curta isolada em dados sintéticos
destinados ao aquecimento. Por exemplo, não use uma movimentação de aquecimento
como parte das métricas do cenário e não misture registros criados pelo
aquecimento com o histórico de medição.

Execute pelo menos três repetições independentes de cada endpoint. Cada
repetição deve usar uma preparação própria, um run ID próprio, um volume
próprio e uma limpeza correspondente.

## Execução

Inicie a API compilada em outro processo usando o mesmo `DATABASE_URL` de
`stockflow_perf`:

```bash
cd backend
npm run build
DATABASE_URL="$PERF_DATABASE_URL" npm start
```

No PowerShell:

```powershell
cd backend
npm run build
$env:DATABASE_URL = $env:PERF_DATABASE_URL
npm start
```

Configure `PERF_BASE_URL` se a API não estiver em `http://127.0.0.1:3333`.
Configure `PERF_RUN_ID` com o identificador registrado pela preparação.
Configure `PERF_EXECUTION_ID` com um identificador exclusivo em toda repetição.
O destino k6 aceita somente `localhost`, `127.0.0.1` e `::1`.

Exemplos de execução:

```bash
cd backend/performance

k6 run scripts/get-products.js
k6 run scripts/get-product-by-id.js
k6 run scripts/post-products.js
k6 run scripts/post-entry.js
k6 run scripts/post-exit.js
```

Para `POST /products`, use um ID exclusivo em cada repetição:

```bash
PERF_EXECUTION_ID=execution-1 k6 run scripts/post-products.js
PERF_EXECUTION_ID=execution-2 k6 run scripts/post-products.js
PERF_EXECUTION_ID=execution-3 k6 run scripts/post-products.js
```

Para exportar resultados JSON e resumo:

```bash
k6 run --out json=results/get-products-execution-1.json \
  --summary-export=results/get-products-execution-1-summary.json \
  scripts/get-products.js
```

Repita o comando para execuções independentes 2 e 3. O mesmo padrão pode ser
usado para os outros endpoints.

Não execute os testes no GitHub Actions nem contra qualquer ambiente remoto.

## Exportação dos resultados

Cada execução deve registrar:

- média;
- p50;
- p95;
- p99;
- requisições por segundo;
- total de requisições;
- taxa de erros;
- timeouts.

O resultado bruto e o resumo devem indicar endpoint, execução, volume, nível
de concorrência e duração. Não há thresholds configurados.
O resumo k6 é configurado com `summaryTrendStats` para incluir média, mediana
(p50), p95, p99 e máximo.

## Limpeza segura

Após cada execução, informe o run ID usado pela preparação:

```bash
cd backend/performance
npx tsx scripts/cleanup-data.ts --run-id PERF_RUN_ID_AQUI
```

A limpeza:

- exige `PERF_DATABASE_URL`;
- verifica o banco `stockflow_perf`;
- lê somente o registro da execução informada;
- exclui movimentações dos IDs registrados;
- exclui somente produtos com IDs registrados e SKUs iniciados pelo prefixo
  `PERF-` da execução;
- nunca executa `deleteMany` geral em todas as tabelas;
- falha sem alteração destrutiva se o registro ou a conexão não passar nas
  verificações.

As movimentações e produtos criados pelo k6 possuem SKUs ou relacionamentos
registrados pela execução. Não execute limpeza contra dados não preparados pela
mesma execução.

Cada repetição e cada volume de massa devem seguir este ciclo:

1. preparar uma massa exclusiva;
2. executar somente os cenários planejados sobre essa massa;
3. exportar os resultados;
4. limpar os dados dessa execução;
5. preparar novamente antes da próxima repetição ou volume.

Não execute vários cenários de escrita sobre a mesma massa sem considerar
alterações de saldo e histórico. Entrada e saída devem ser cenários separados.

## Riscos operacionais

- Competição por CPU, memória ou rede com outros processos.
- Uso involuntário de banco incorreto.
- SKUs duplicados entre execuções.
- Alteração da massa durante o cenário.
- Produtos do E2E ou integração sendo incluídos na consulta.
- Cache ainda não estabilizado antes da medição.
- Exaustão de saldo no cenário EXIT.
- Interrupção da preparação ou limpeza.
- Execução de carga contra máquina ou banco remoto não controlado.
