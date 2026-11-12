import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createProductSchema,
  productIdSchema,
} from "../types/product";
import {
  createProduct,
  getProductById,
  listProducts,
  ProductServiceError,
} from "../services/product.service";

const validationErrorResponse = (response: Response, error: ZodError) =>
  response.status(400).json({
    error: "Invalid request data.",
    details: error.issues,
  });

export const create = async (request: Request, response: Response) => {
  try {
    const input = createProductSchema.parse(request.body);
    const product = await createProduct(input);

    return response.status(201).json(product);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return validationErrorResponse(response, error);
    }

    if (
      error instanceof ProductServiceError &&
      error.code === "DUPLICATE_SKU"
    ) {
      return response.status(409).json({ error: error.message });
    }

    throw error;
  }
};

export const list = async (_request: Request, response: Response) => {
  const products = await listProducts();
  return response.status(200).json(products);
};

export const getById = async (request: Request, response: Response) => {
  try {
    const id = productIdSchema.parse(request.params.id);
    const product = await getProductById(id);

    return response.status(200).json(product);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return validationErrorResponse(response, error);
    }

    if (
      error instanceof ProductServiceError &&
      error.code === "NOT_FOUND"
    ) {
      return response.status(404).json({ error: error.message });
    }

    throw error;
  }
};
