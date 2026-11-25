import { ChildProcess, spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../config/database";
import { hashPassword } from "../utils/password";

type ProductResponse = {
  id: string;
  sku: string;
  quantity: number;
};

type ProductListResponse = {
  items: ProductResponse[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

type MovementResponse = {
  productId: string;
  type: "ENTRY" | "EXIT";
  quantity: number;
  performedById?: string | null;
};

const sku = `SYSTEM-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
let baseUrl = "";
let product: ProductResponse;
let serverProcess: ChildProcess | undefined;
let systemAdminId = "";
let sessionCookie = "";
const systemAdminEmail = `system-admin-${Date.now()}@example.invalid`;
const concurrentSku = `SYSTEM-CONCURRENT-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

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
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers);
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    headers.set("Origin", baseUrl);
  }
  if (sessionCookie) {
    headers.set("Cookie", sessionCookie);
  }
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
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
  const passwordHash = await hashPassword("System-Test-Password-2026!");
  const systemAdmin = await prisma.user.create({
    data: {
      name: "StockFlow System Test Admin",
      email: systemAdminEmail,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
    select: { id: true },
  });
  systemAdminId = systemAdmin.id;

  const port = await getAvailablePort();
  baseUrl = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, ["dist/server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      CORS_ORIGINS: baseUrl,
    },
    stdio: "ignore",
  });

  await waitForHealth();
  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl,
    },
    body: JSON.stringify({
      email: systemAdminEmail,
      password: "System-Test-Password-2026!",
    }),
  });
  if (!loginResponse.ok) {
    throw new Error(`System test administrator login failed: ${loginResponse.status}`);
  }
  const setCookie = loginResponse.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("System test administrator session cookie was not issued.");
  }
  sessionCookie = setCookie.split(";", 1)[0] ?? "";
});

afterAll(async () => {
  try {
    const skus = [sku, concurrentSku];

    for (const createdSku of skus) {
      const createdProduct = await prisma.product.findUnique({
        where: { sku: createdSku },
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
    }
    if (systemAdminId) {
      await prisma.session.deleteMany({ where: { userId: systemAdminId } });
      await prisma.user.deleteMany({ where: { id: systemAdminId } });
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
    const { response, body } = await fetchJson<ProductListResponse>("/products");

    expect(response.status).toBe(200);
    expect(body.items.some((item) => item.id === product.id)).toBe(true);
    expect(body.pagination.page).toBe(1);
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
      performedById: systemAdminId,
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

  it("allows only one of two simultaneous exits", async () => {
    const created = await fetchJson<ProductResponse>("/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: concurrentSku,
        name: "Concurrent system test product",
      }),
    });

    expect(created.response.status).toBe(201);
    const concurrentProductId = created.body.id;

    const entry = await fetchJson<MovementResponse>("/stock-movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: concurrentProductId,
        type: "ENTRY",
        quantity: 10,
      }),
    });
    expect(entry.response.status).toBe(201);

    const exitRequests = [1, 2].map(() =>
      fetchJson<MovementResponse>("/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: concurrentProductId,
          type: "EXIT",
          quantity: 7,
        }),
      }),
    );

    const exitResponses = await Promise.all(exitRequests);
    const statuses = exitResponses
      .map(({ response }) => response.status)
      .sort();

    expect(statuses).toEqual([201, 409]);

    const balance = await fetchJson<ProductResponse>(
      `/products/${concurrentProductId}`,
    );
    expect(balance.response.status).toBe(200);
    expect(balance.body.quantity).toBe(3);

    const history = await fetchJson<MovementResponse[]>(
      `/products/${concurrentProductId}/movements`,
    );
    expect(history.response.status).toBe(200);
    expect(history.body).toHaveLength(2);
    expect(history.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "ENTRY",
          quantity: 10,
        }),
        expect.objectContaining({
          type: "EXIT",
          quantity: 7,
        }),
      ]),
    );
  });
});
