import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as productService from "./services/product.service";
import {
  create,
  deactivate,
  getById,
  list,
  update,
} from "./controllers/product.controller";
import { ProductServiceError } from "./services/product.service";

const validId = "11111111-1111-4111-8111-111111111111";
const product = {
  id: validId,
  sku: "SKU-CONTROLLER-001",
  name: "Controller product",
  description: null,
  minStock: 2,
  categoryId: null,
  category: null,
  unit: "UN",
  location: null,
  quantity: 0,
  isActive: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const makeContext = (overrides: Partial<Request> = {}) => {
  const request = {
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as Request;
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;
  vi.mocked(response.status).mockReturnValue(response);
  vi.mocked(response.json).mockReturnValue(response);
  return { request, response };
};

afterEach(() => vi.restoreAllMocks());

describe("Product controller", () => {
  it("creates a product and returns 201", async () => {
    vi.spyOn(productService, "createProduct").mockResolvedValue(product);
    const { request, response } = makeContext({
      body: { sku: product.sku, name: product.name, minStock: 2 },
    });

    await create(request, response);

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith(product);
  });

  it("returns 400 when creation data is invalid", async () => {
    const service = vi.spyOn(productService, "createProduct");
    const { request, response } = makeContext({ body: { sku: "", name: "" } });

    await create(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(service).not.toHaveBeenCalled();
  });

  it("maps duplicate SKU errors to 409", async () => {
    vi.spyOn(productService, "createProduct").mockRejectedValue(
      new ProductServiceError("DUPLICATE_SKU", "SKU already exists."),
    );
    const { request, response } = makeContext({
      body: { sku: product.sku, name: product.name },
    });

    await create(request, response);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({ error: "SKU already exists." });
  });

  it("lists products and returns 200", async () => {
    const result = {
      items: [product],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    };
    vi.spyOn(productService, "listProducts").mockResolvedValue(result);
    const { request, response } = makeContext();

    await list(request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(result);
  });

  it("returns 400 for invalid list query parameters", async () => {
    const service = vi.spyOn(productService, "listProducts");
    const { request, response } = makeContext({ query: { page: "0" } });

    await list(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(service).not.toHaveBeenCalled();
  });

  it("propagates unexpected list errors", async () => {
    const error = new Error("Database unavailable");
    vi.spyOn(productService, "listProducts").mockRejectedValue(error);
    const { request, response } = makeContext();

    await expect(list(request, response)).rejects.toBe(error);
  });

  it("gets a product by ID", async () => {
    vi.spyOn(productService, "getProductById").mockResolvedValue(product);
    const { request, response } = makeContext({ params: { id: validId } });

    await getById(request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(product);
  });

  it("rejects an invalid product ID", async () => {
    const service = vi.spyOn(productService, "getProductById");
    const { request, response } = makeContext({ params: { id: "invalid" } });

    await getById(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(service).not.toHaveBeenCalled();
  });

  it("maps missing products to 404", async () => {
    vi.spyOn(productService, "getProductById").mockRejectedValue(
      new ProductServiceError("NOT_FOUND", "Product not found."),
    );
    const { request, response } = makeContext({ params: { id: validId } });

    await getById(request, response);

    expect(response.status).toHaveBeenCalledWith(404);
  });

  it("updates product details", async () => {
    const updated = { ...product, name: "Updated name" };
    vi.spyOn(productService, "updateProduct").mockResolvedValue(updated);
    const { request, response } = makeContext({
      params: { id: validId },
      body: { name: "Updated name" },
    });

    await update(request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(updated);
  });

  it("rejects an empty product update", async () => {
    const service = vi.spyOn(productService, "updateProduct");
    const { request, response } = makeContext({ params: { id: validId }, body: {} });

    await update(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(service).not.toHaveBeenCalled();
  });

  it("maps duplicate SKU on update to 409", async () => {
    vi.spyOn(productService, "updateProduct").mockRejectedValue(
      new ProductServiceError("DUPLICATE_SKU", "SKU already exists."),
    );
    const { request, response } = makeContext({
      params: { id: validId },
      body: { sku: "TAKEN-SKU" },
    });

    await update(request, response);

    expect(response.status).toHaveBeenCalledWith(409);
  });

  it("deactivates a product", async () => {
    const inactive = { ...product, isActive: false };
    vi.spyOn(productService, "deactivateProduct").mockResolvedValue(inactive);
    const { request, response } = makeContext({ params: { id: validId } });

    await deactivate(request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(inactive);
  });

  it("rejects an invalid ID when deactivating", async () => {
    const service = vi.spyOn(productService, "deactivateProduct");
    const { request, response } = makeContext({ params: { id: "not-a-uuid" } });

    await deactivate(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(service).not.toHaveBeenCalled();
  });

  it("maps a missing product on deactivation to 404", async () => {
    vi.spyOn(productService, "deactivateProduct").mockRejectedValue(
      new ProductServiceError("NOT_FOUND", "Product not found."),
    );
    const { request, response } = makeContext({ params: { id: validId } });

    await deactivate(request, response);

    expect(response.status).toHaveBeenCalledWith(404);
  });
});
