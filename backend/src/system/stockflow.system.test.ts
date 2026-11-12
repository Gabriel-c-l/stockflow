import { ChildProcess, spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../config/database";

type ProductResponse = {
  id: string;
  sku: string;
  quantity: number;
};

type MovementResponse = {
  productId: string;
  type: "ENTRY" | "EXIT";
  quantity: number;
};

const sku = `SYSTEM-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
let baseUrl = "";
let product: ProductResponse;
let serverProcess: ChildProcess | undefined;

const getAvailablePort = async (): Promise<number> => {
  const server = createServer();

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not determine an available TCP port.");
  }

  const port = address.port;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
};

const fetchJson = async <T>(
  path: string,
  init?: RequestInit,
): Promise<{ response: Response; body: T }> => {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = (await response.json()) as T;
  return { response, body };
};

const waitForHealth = async (): Promise<void> => {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // The child process may still be starting.
    }

    await delay(250);
  }

  throw new Error("The system test server did not become ready.");
};

const stopServer = async (): Promise<void> => {
  if (!serverProcess) {
    return;
  }

  const processToStop = serverProcess;
  serverProcess = undefined;

  if (processToStop.exitCode === null && !processToStop.killed) {
    processToStop.kill();
  }

  if (processToStop.exitCode === null) {
    await new Promise<void>((resolve) => {
      processToStop.once("exit", () => resolve());
    });
  }
};

beforeAll(async () => {
  const port = await getAvailablePort();
  baseUrl = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, ["dist/server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
    },
    stdio: "ignore",
  });

  await waitForHealth();
});

afterAll(async () => {
  try {
    const createdProduct = await prisma.product.findUnique({
      where: { sku },
      select: { id: true },
    });

    if (createdProduct) {
      await prisma.stockMovement.deleteMany({
        where: { productId: createdProduct.id },
      });
      await prisma.product.deleteMany({
        where: { id: createdProduct.id },
      });
    }
  } finally {
    await stopServer();
    await prisma.$disconnect();
  }
});

describe("StockFlow system tests", () => {
  it("performs a health check over real HTTP", async () => {
    const { response, body } = await fetchJson<{
      status: string;
      service: string;
      timestamp: string;
    }>("/health");

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "ok",
      service: "stockflow-api",
    });
  });

  it("registers a product over real HTTP", async () => {
    const { response, body } = await fetchJson<ProductResponse>("/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, name: "System test product" }),
    });

    expect(response.status).toBe(201);
    expect(body.sku).toBe(sku);
    expect(body.quantity).toBe(0);
    product = body;
  });

  it("retrieves the created product", async () => {
    const { response, body } = await fetchJson<ProductResponse>(
      `/products/${product.id}`,
    );

    expect(response.status).toBe(200);
    expect(body.id).toBe(product.id);
    expect(body.sku).toBe(sku);
  });

  it("lists the created product", async () => {
    const { response, body } = await fetchJson<ProductResponse[]>("/products");

    expect(response.status).toBe(200);
    expect(body.some((item) => item.id === product.id)).toBe(true);
  });

  it("registers an ENTRY of 20 units", async () => {
    const { response, body } = await fetchJson<MovementResponse>(
      "/stock-movements",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          type: "ENTRY",
          quantity: 20,
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      productId: product.id,
      type: "ENTRY",
      quantity: 20,
    });
  });

  it("registers an EXIT of 5 units", async () => {
    const { response, body } = await fetchJson<MovementResponse>(
      "/stock-movements",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          type: "EXIT",
          quantity: 5,
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      productId: product.id,
      type: "EXIT",
      quantity: 5,
    });
  });

  it("reports a final stock balance of 15", async () => {
    const { response, body } = await fetchJson<ProductResponse>(
      `/products/${product.id}`,
    );

    expect(response.status).toBe(200);
    expect(body.quantity).toBe(15);
  });

  it("rejects an EXIT greater than the available stock", async () => {
    const { response } = await fetchJson("/stock-movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        type: "EXIT",
        quantity: 16,
      }),
    });

    expect(response.status).toBe(409);
  });

  it("keeps the stock balance at 15 after the rejected EXIT", async () => {
    const { response, body } = await fetchJson<ProductResponse>(
      `/products/${product.id}`,
    );

    expect(response.status).toBe(200);
    expect(body.quantity).toBe(15);
  });

  it("returns the two valid movements in the product history", async () => {
    const { response, body } = await fetchJson<MovementResponse[]>(
      `/products/${product.id}/movements`,
    );

    expect(response.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "ENTRY", quantity: 20 }),
        expect.objectContaining({ type: "EXIT", quantity: 5 }),
      ]),
    );
  });
});
