import { Prisma } from "../generated/prisma/client";
import * as productRepository from "../repositories/product.repository";
import type { CreateProductInput } from "../types/product";

export class ProductServiceError extends Error {
  constructor(
    public readonly code: "DUPLICATE_SKU" | "NOT_FOUND",
    message: string,
  ) {
    super(message);
  }
}

export const createProduct = async (input: CreateProductInput) => {
  try {
    return await productRepository.createProduct(input);
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ProductServiceError("DUPLICATE_SKU", "SKU already exists.");
    }

    throw error;
  }
};

export const listProducts = () => productRepository.findProducts();

export const getProductById = async (id: string) => {
  const product = await productRepository.findProductById(id);

  if (!product) {
    throw new ProductServiceError("NOT_FOUND", "Product not found.");
  }

  return product;
};
