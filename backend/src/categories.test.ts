import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestApp } from "./test-utils";
import { prisma } from "./config/database";

const app = createTestApp();
const prefix = "TEST-CATEGORY-";

beforeEach(async () => {
  await prisma.product.deleteMany({ where: { sku: { startsWith: "TEST-CATEGORY-PRODUCT-" } } });
  await prisma.category.deleteMany({ where: { name: { startsWith: prefix } } });
});
afterAll(async () => {
  await prisma.product.deleteMany({ where: { sku: { startsWith: "TEST-CATEGORY-PRODUCT-" } } });
  await prisma.category.deleteMany({ where: { name: { startsWith: prefix } } });
  await prisma.$disconnect();
});

describe("Categories", () => {
  it("creates and lists an active category", async () => {
    const created = await request(app).post("/categories").send({ name: `${prefix}OFFICE`, description: "Office supplies" });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: `${prefix}OFFICE`, isActive: true, description: "Office supplies" });
    const list = await request(app).get("/categories");
    expect(list.status).toBe(200);
    expect(list.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: created.body.id })]));
  });

  it("rejects duplicate names", async () => {
    await request(app).post("/categories").send({ name: `${prefix}DUPLICATE` });
    const duplicate = await request(app).post("/categories").send({ name: `${prefix}DUPLICATE` });
    expect(duplicate.status).toBe(409);
  });

  it("updates a category", async () => {
    const created = await request(app).post("/categories").send({ name: `${prefix}OLD` });
    const updated = await request(app).patch(`/categories/${created.body.id}`).send({ name: `${prefix}NEW` });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe(`${prefix}NEW`);
  });

  it("prevents deactivation while active products use the category", async () => {
    const category = await request(app).post("/categories").send({ name: `${prefix}IN-USE` });
    await request(app).post("/products").send({ sku: "TEST-CATEGORY-PRODUCT-1", name: "Linked product", categoryId: category.body.id });
    const result = await request(app).delete(`/categories/${category.body.id}`);
    expect(result.status).toBe(409);
  });

  it("deactivates an unused category and keeps it available in inactive filter", async () => {
    const category = await request(app).post("/categories").send({ name: `${prefix}DEACTIVATE` });
    const result = await request(app).delete(`/categories/${category.body.id}`);
    expect(result.status).toBe(200);
    expect(result.body.isActive).toBe(false);
    const inactive = await request(app).get("/categories?status=inactive");
    expect(inactive.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: category.body.id, isActive: false })]));
  });

  it("creates products with unit and location metadata", async () => {
    const category = await request(app).post("/categories").send({ name: `${prefix}TOOLS` });
    const product = await request(app).post("/products").send({ sku: "TEST-CATEGORY-PRODUCT-META", name: "Hammer", categoryId: category.body.id, unit: "UN", location: "A-01-02" });
    expect(product.status).toBe(201);
    expect(product.body).toMatchObject({ categoryId: category.body.id, unit: "UN", location: "A-01-02" });
    expect(product.body.category).toMatchObject({ id: category.body.id, name: `${prefix}TOOLS` });
  });
});
