import "dotenv/config";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const SUPPORTED_COUNTS = new Set([100, 500, 1000]);

const getArgument = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const main = async (): Promise<void> => {
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

  const countArgument = getArgument("--count");
  const count = countArgument ? Number(countArgument) : Number.NaN;
  if (!SUPPORTED_COUNTS.has(count)) {
    throw new Error("Use --count with one of the supported values: 100, 500 or 1000.");
  }

  const runId = randomUUID();
  const prefix = `PERF-${runId}-`;
  const registryPath = resolve(process.cwd(), "results", "performance-run.json");

  await mkdir(resolve(process.cwd(), "results"), { recursive: true });

  try {
    await readFile(registryPath);
    throw new Error(
      "A performance registry already exists. Clean the previous run before preparing a new one.",
    );
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const registry = {
    runId,
    prefix,
    creationPrefix: prefix,
    creationCount: count,
    count,
    createdAt: new Date().toISOString(),
    products: [] as Array<{ id: string; sku: string; role: "query" | "movement" }>,
    queryIds: [] as string[],
    movementIds: [] as string[],
  };

  try {
    await prisma.$connect();
    const currentDatabase = await prisma.$queryRaw<Array<{ database_name: string }>>`
      SELECT current_database() AS database_name
    `;

    if (currentDatabase[0]?.database_name !== "stockflow_perf") {
      throw new Error("The connected database is not stockflow_perf.");
    }

    for (let index = 0; index < count; index += 1) {
      const role = index % 2 === 0 ? "query" : ("movement" as const);
      const sku = `${prefix}${role === "query" ? "QUERY" : "MOVEMENT"}-${index}`;
      const product = await prisma.product.create({
        data: {
          sku,
          name: `Performance test product ${index}`,
          description: "Synthetic performance test data",
          quantity: role === "movement" ? 100000 : 100,
          minStock: 0,
        },
      });

      registry.products.push({ id: product.id, sku, role });
      if (role === "query") {
        registry.queryIds.push(product.id);
      } else {
        registry.movementIds.push(product.id);
      }

      await writeFile(registryPath, JSON.stringify(registry, null, 2), "utf8");
    }

    console.log(`Prepared ${count} synthetic products for performance run ${runId}.`);
    console.log(`Registry: ${registryPath}`);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Preparation failed.");
  process.exitCode = 1;
});
