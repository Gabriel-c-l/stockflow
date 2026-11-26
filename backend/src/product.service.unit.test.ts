import { Prisma } from "./generated/prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as productRepository from "./repositories/product.repository";
import {
  createProduct,
  getProductById,
  listProducts,
  updateProduct,
  deactivateProduct,
  ProductServiceError,
} from "./services/product.service";
import { createProductSchema } from "./types/product";

vi.mock("./repositories/product.repository", () => ({
  createProduct: vi.fn(),
  findProductById: vi.fn(),
  findProducts: vi.fn(),
  updateProduct: vi.fn(),
  deactivateProduct: vi.fn(),
}));

const mockedProductRepository = vi.mocked(productRepository);

const productInput = {
  sku: "SKU-UNIT-001",
  name: "Unit product",
  minStock: 2,
  unit: "UN" as const,
};

const product = {
  id: "00000000-0000-0000-0000-000000000001",
  ...productInput,
  description: null,
  price: new Prisma.Decimal(0),
  categoryId: null,
  category: null,
  unit: "UN",
  location: null,
  quantity: 0,
  isActive: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("ProductService unit tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a valid product through the repository", async () => {
    mockedProductRepository.createProduct.mockResolvedValue(product);

    await expect(createProduct(productInput)).resolves.toEqual(product);
    expect(mockedProductRepository.createProduct).toHaveBeenCalledWith(
      productInput,
    );
  });

  it("translates a duplicated SKU into a service error", async () => {
    const duplicateError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      { code: "P2002", clientVersion: "7.10.1" },
    );
    mockedProductRepository.createProduct.mockRejectedValue(duplicateError);

    await expect(createProduct(productInput)).rejects.toMatchObject({
      code: "DUPLICATE_SKU",
      message: "SKU already exists.",
    });
  });

  it("rejects invalid product data in the schema", () => {
    expect(() =>
      createProductSchema.parse({
        sku: " ",
        name: "",
        minStock: -1,
      }),
    ).toThrow();
    expect(mockedProductRepository.createProduct).not.toHaveBeenCalled();
  });

  it("raises NOT_FOUND for a missing product", async () => {
    mockedProductRepository.findProductById.mockResolvedValue(null);

    await expect(getProductById(product.id)).rejects.toEqual(
      new ProductServiceError("NOT_FOUND", "Product not found."),
    );
  });

  it("lists products through the repository", async () => {
    const query = { status: "active" as const, search: undefined, page: 1, pageSize: 20 };
    const result = { items: [product], pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } };
    mockedProductRepository.findProducts.mockResolvedValue(result);

    await expect(listProducts(query)).resolves.toEqual(result);
    expect(mockedProductRepository.findProducts).toHaveBeenCalledWith(query);
  });

  it("updates product details through the repository", async () => {
    const input = { name: "Updated unit product" };
    const updated = { ...product, ...input };
    mockedProductRepository.updateProduct.mockResolvedValue(updated);

    await expect(updateProduct(product.id, input)).resolves.toEqual(updated);
    expect(mockedProductRepository.updateProduct).toHaveBeenCalledWith(product.id, input);
  });

  it("translates a duplicate SKU during update", async () => {
    const duplicateError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      { code: "P2002", clientVersion: "7.10.1" },
    );
    mockedProductRepository.updateProduct.mockRejectedValue(duplicateError);

    await expect(updateProduct(product.id, { sku: "TAKEN" })).rejects.toMatchObject({
      code: "DUPLICATE_SKU",
    });
  });

  it("propagates unexpected update errors", async () => {
    const error = new Error("Unexpected repository failure");
    mockedProductRepository.updateProduct.mockRejectedValue(error);

    await expect(updateProduct(product.id, { name: "Updated" })).rejects.toBe(error);
  });

  it("deactivates a product through the repository", async () => {
    const inactive = { ...product, isActive: false };
    mockedProductRepository.deactivateProduct.mockResolvedValue(inactive);

    await expect(deactivateProduct(product.id)).resolves.toEqual(inactive);
    expect(mockedProductRepository.deactivateProduct).toHaveBeenCalledWith(product.id);
  });

  it("translates a missing product during deactivation", async () => {
    const missingError = new Prisma.PrismaClientKnownRequestError(
      "Record not found",
      { code: "P2025", clientVersion: "7.10.1" },
    );
    mockedProductRepository.deactivateProduct.mockRejectedValue(missingError);

    await expect(deactivateProduct(product.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

});
