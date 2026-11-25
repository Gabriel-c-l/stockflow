import { Prisma } from "../generated/prisma/client";
import * as productRepository from "../repositories/product.repository";
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from "../types/product";
import { assertCategoryIsActive } from "./category.service";

export class ProductServiceError extends Error {
  constructor(public readonly code: "DUPLICATE_SKU" | "NOT_FOUND" | "HAS_MOVEMENTS", message: string) { super(message); }
}

const translateProductError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") throw new ProductServiceError("DUPLICATE_SKU", "SKU already exists.");
    if (error.code === "P2025") throw new ProductServiceError("NOT_FOUND", "Product not found.");
  }
  throw error;
};

export const createProduct = async (input: CreateProductInput) => {
  try { await assertCategoryIsActive(input.categoryId); return await productRepository.createProduct(input); }
  catch (error: unknown) { return translateProductError(error); }
};

export const listProducts = (query: ListProductsQuery) => productRepository.findProducts(query);

export const getProductById = async (id: string) => {
  const product = await productRepository.findProductById(id);
  if (!product) throw new ProductServiceError("NOT_FOUND", "Product not found.");
  return product;
};

export const updateProduct = async (id: string, input: UpdateProductInput) => {
  try { await assertCategoryIsActive(input.categoryId); return await productRepository.updateProduct(id, input); }
  catch (error: unknown) { return translateProductError(error); }
};

export const deactivateProduct = async (id: string) => {
  try { return await productRepository.deactivateProduct(id); }
  catch (error: unknown) { return translateProductError(error); }
};
