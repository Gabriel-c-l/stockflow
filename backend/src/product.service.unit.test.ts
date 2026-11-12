import { Prisma } from "./generated/prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as productRepository from "./repositories/product.repository";
import {
  createProduct,
  getProductById,
  listProducts,
  ProductServiceError,
} from "./services/product.service";
import { createProductSchema } from "./types/product";

vi.mock("./repositories/product.repository", () => ({
  createProduct: vi.fn(),
  findProductById: vi.fn(),
  findProducts: vi.fn(),
}));

const mockedProductRepository = vi.mocked(productRepository);

const productInput = {
  sku: "SKU-UNIT-001",
  name: "Unit product",
  minStock: 2,
};

const product = {
  id: "00000000-0000-0000-0000-000000000001",
  ...productInput,
  description: null,
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
    mockedProductRepository.findProducts.mockResolvedValue([product]);

    await expect(listProducts()).resolves.toEqual([product]);
    expect(mockedProductRepository.findProducts).toHaveBeenCalledOnce();
  });
});
