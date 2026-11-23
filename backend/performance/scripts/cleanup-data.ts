import "dotenv/config";
import { readFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

type Registry = {
  runId: string;
  prefix: string;
  products: Array<{ id: string; sku: string; role: "query" | "movement" }>;
};

const getArgument = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const main = async (): Promise<void> => {
  const runId = getArgument("--run-id");
  if (!runId) {
    throw new Error("Use --run-id with the performance run identifier.");
  }

  const connectionString = process.env.PERF_DATABASE_URL;
  if (!connectionString) {
    throw new Error("PERF_DATABASE_URL must be explicitly configured.");
  }
  if (process.env.DATABASE_URL !== connectionString) {
    throw new Error(
      "DATABASE_URL must exist and be exactly equal to PERF_DATABASE_URL.",
    );
  }

  const url = new URL(connectionString);
  const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

  if (databaseName !== "stockflow_perf") {
    throw new Error("PERF_DATABASE_URL must use the stockflow_perf database.");
  }

  if (!localHosts.has(url.hostname)) {
    throw new Error("PERF_DATABASE_URL must point to a local PostgreSQL host.");
  }

  const registryPath = resolve(process.cwd(), "results", "performance-run.json");
  const registry = JSON.parse(await readFile(registryPath, "utf8")) as Registry;

  if (registry.runId !== runId) {
    throw new Error("The requested run ID does not match the prepared registry.");
  }

  const expectedPrefix = `PERF-${runId}-`;
  if (registry.prefix !== expectedPrefix || registry.products.length === 0) {
    throw new Error("The performance registry failed the safety validation.");
  }

  const productIds = registry.products.map((product) => product.id);
  for (const product of registry.products) {
    if (!product.sku.startsWith(expectedPrefix)) {
      throw new Error("A registry SKU is outside the performance execution prefix.");
    }
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();
    const currentDatabase = await prisma.$queryRaw<Array<{ database_name: string }>>`
      SELECT current_database() AS database_name
    `;

    if (currentDatabase[0]?.database_name !== "stockflow_perf") {
      throw new Error("The connected database is not stockflow_perf.");
    }

    await prisma.$transaction(async (transaction) => {
      const registered = await transaction.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, sku: true },
      });

      if (registered.some((product) => !product.sku.startsWith(expectedPrefix))) {
        throw new Error("An existing SKU changed outside the execution prefix.");
      }

      const executionProducts = await transaction.product.findMany({
        where: { sku: { startsWith: expectedPrefix } },
        select: { id: true },
      });
      const executionProductIds = executionProducts.map((product) => product.id);

      await transaction.stockMovement.deleteMany({
        where: { productId: { in: executionProductIds } },
      });

      await transaction.product.deleteMany({
        where: {
          id: { in: executionProductIds },
          sku: { startsWith: expectedPrefix },
        },
      });
    });

    await unlink(registryPath);
    console.log(`Cleaned performance run ${runId}.`);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Cleanup failed.");
  process.exitCode = 1;
});
