import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "./server";
import { prisma } from "./config/database";

const testSkuPrefix = "TEST-PRODUCT-";

const productPayload = (sku: string) => ({
  sku,
  name: "Test product",
  description: "Product used in automated tests",
  minStock: 5,
});

beforeEach(async () => {
  await prisma.product.deleteMany({
    where: { sku: { startsWith: testSkuPrefix } },
  });
});

afterAll(async () => {
  await prisma.product.deleteMany({
    where: { sku: { startsWith: testSkuPrefix } },
  });
  await prisma.$disconnect();
});

describe("Products", () => {
  it("creates a valid product", async () => {
    const response = await request(app)
      .post("/products")
      .send(productPayload(`${testSkuPrefix}CREATE`));

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      sku: `${testSkuPrefix}CREATE`,
      name: "Test product",
      quantity: 0,
      minStock: 5,
      isActive: true,
    });
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.createdAt).toEqual(expect.any(String));
    expect(response.body.updatedAt).toEqual(expect.any(String));
  });

  it("rejects a duplicated SKU", async () => {
    const sku = `${testSkuPrefix}DUPLICATE`;
    await request(app).post("/products").send(productPayload(sku));

    const response = await request(app)
      .post("/products")
      .send(productPayload(sku));

    expect(response.status).toBe(409);
  });

  it("rejects an empty name", async () => {
    const response = await request(app)
      .post("/products")
      .send({ ...productPayload(`${testSkuPrefix}EMPTY-NAME`), name: "   " });

    expect(response.status).toBe(400);
  });

  it("rejects an empty SKU", async () => {
    const response = await request(app)
      .post("/products")
      .send({ ...productPayload(`${testSkuPrefix}EMPTY-SKU`), sku: "   " });

    expect(response.status).toBe(400);
  });

  it("rejects a negative minStock", async () => {
    const response = await request(app)
      .post("/products")
      .send({ ...productPayload(`${testSkuPrefix}NEGATIVE`), minStock: -1 });

    expect(response.status).toBe(400);
  });

  it("rejects quantity during creation", async () => {
    const response = await request(app)
      .post("/products")
      .send({ ...productPayload(`${testSkuPrefix}QUANTITY`), quantity: 10 });

    expect(response.status).toBe(400);
  });

  it("lists products", async () => {
    await request(app)
      .post("/products")
      .send(productPayload(`${testSkuPrefix}LIST`));

    const response = await request(app).get("/products");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sku: `${testSkuPrefix}LIST` }),
      ]),
    );
  });

  it("gets an existing product by ID", async () => {
    const created = await request(app)
      .post("/products")
      .send(productPayload(`${testSkuPrefix}GET`));

    const response = await request(app).get(`/products/${created.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: created.body.id,
      sku: `${testSkuPrefix}GET`,
    });
  });

  it("returns 404 for a missing product", async () => {
    const response = await request(app).get(
      "/products/00000000-0000-0000-0000-000000000000",
    );

    expect(response.status).toBe(404);
  });
});
