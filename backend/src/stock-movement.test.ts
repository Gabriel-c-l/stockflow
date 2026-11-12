import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "./server";
import { prisma } from "./config/database";

const testSkuPrefix = "TEST-MOVEMENT-";

const createProduct = async (suffix: string) => {
  const response = await request(app)
    .post("/products")
    .send({
      sku: `${testSkuPrefix}${suffix}`,
      name: "Movement test product",
    });

  expect(response.status).toBe(201);
  return response.body as { id: string; quantity: number };
};

const movementPayload = (
  productId: string,
  type: string,
  quantity: number,
) => ({
  productId,
  type,
  quantity,
});

beforeEach(async () => {
  await prisma.stockMovement.deleteMany({
    where: { product: { sku: { startsWith: testSkuPrefix } } },
  });
  await prisma.product.deleteMany({
    where: { sku: { startsWith: testSkuPrefix } },
  });
});

afterAll(async () => {
  await prisma.stockMovement.deleteMany({
    where: { product: { sku: { startsWith: testSkuPrefix } } },
  });
  await prisma.product.deleteMany({
    where: { sku: { startsWith: testSkuPrefix } },
  });
  await prisma.$disconnect();
});

describe("Stock movements", () => {
  it("registers an ENTRY and increases stock", async () => {
    const product = await createProduct("ENTRY");

    const response = await request(app)
      .post("/stock-movements")
      .send(movementPayload(product.id, "ENTRY", 10));

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      productId: product.id,
      type: "ENTRY",
      quantity: 10,
    });

    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(updatedProduct?.quantity).toBe(10);
  });

  it("registers an EXIT and decreases stock", async () => {
    const product = await createProduct("EXIT");
    await request(app)
      .post("/stock-movements")
      .send(movementPayload(product.id, "ENTRY", 10));

    const response = await request(app)
      .post("/stock-movements")
      .send(movementPayload(product.id, "EXIT", 4));

    expect(response.status).toBe(201);
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(updatedProduct?.quantity).toBe(6);
  });

  it("returns the product movement history", async () => {
    const product = await createProduct("HISTORY");
    await request(app)
      .post("/stock-movements")
      .send(movementPayload(product.id, "ENTRY", 10));
    await request(app)
      .post("/stock-movements")
      .send(movementPayload(product.id, "EXIT", 3));

    const response = await request(app).get(
      `/products/${product.id}/movements`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "ENTRY", quantity: 10 }),
        expect.objectContaining({ type: "EXIT", quantity: 3 }),
      ]),
    );
  });

  it("returns 404 for a movement on a missing product", async () => {
    const response = await request(app)
      .post("/stock-movements")
      .send(
        movementPayload(
          "00000000-0000-0000-0000-000000000000",
          "ENTRY",
          1,
        ),
      );

    expect(response.status).toBe(404);
  });

  it.each([0, -1])("rejects quantity %s", async (quantity) => {
    const product = await createProduct(`INVALID-${quantity}`);
    const response = await request(app)
      .post("/stock-movements")
      .send(movementPayload(product.id, "ENTRY", quantity));

    expect(response.status).toBe(400);
  });

  it("rejects an invalid movement type", async () => {
    const product = await createProduct("TYPE");
    const response = await request(app)
      .post("/stock-movements")
      .send(movementPayload(product.id, "TRANSFER", 1));

    expect(response.status).toBe(400);
  });

  it("returns 404 for the history of a missing product", async () => {
    const response = await request(app).get(
      "/products/00000000-0000-0000-0000-000000000000/movements",
    );

    expect(response.status).toBe(404);
  });

  it("rejects an EXIT above available stock without changing stock or history", async () => {
    const product = await createProduct("INSUFFICIENT");
    await request(app)
      .post("/stock-movements")
      .send(movementPayload(product.id, "ENTRY", 3));

    const response = await request(app)
      .post("/stock-movements")
      .send(movementPayload(product.id, "EXIT", 4));

    expect(response.status).toBe(409);

    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    const movements = await prisma.stockMovement.findMany({
      where: { productId: product.id },
    });
    expect(updatedProduct?.quantity).toBe(3);
    expect(movements).toHaveLength(1);
    expect(movements[0]?.type).toBe("ENTRY");
  });
});
