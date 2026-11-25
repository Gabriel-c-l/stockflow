import type { Request, Response } from "express";
import { ZodError } from "zod";
import { createProductSchema, listProductsQuerySchema, productIdSchema, updateProductSchema } from "../types/product";
import { createProduct, deactivateProduct, getProductById, listProducts, ProductServiceError, updateProduct } from "../services/product.service";

const validationErrorResponse = (response: Response, error: ZodError) => response.status(400).json({ error: "Invalid request data.", details: error.issues });
const serviceErrorResponse = (response: Response, error: ProductServiceError) => {
  if (error.code === "DUPLICATE_SKU") return response.status(409).json({ error: error.message });
  if (error.code === "NOT_FOUND") return response.status(404).json({ error: error.message });
  return response.status(409).json({ error: error.message });
};

export const create = async (request: Request, response: Response) => {
  try { return response.status(201).json(await createProduct(createProductSchema.parse(request.body))); }
  catch (error: unknown) {
    if (error instanceof ZodError) return validationErrorResponse(response, error);
    if (error instanceof ProductServiceError) return serviceErrorResponse(response, error);
    throw error;
  }
};

export const list = async (request: Request, response: Response) => {
  try { return response.status(200).json(await listProducts(listProductsQuerySchema.parse(request.query))); }
  catch (error: unknown) {
    if (error instanceof ZodError) return validationErrorResponse(response, error);
    throw error;
  }
};

export const getById = async (request: Request, response: Response) => {
  try { return response.status(200).json(await getProductById(productIdSchema.parse(request.params.id))); }
  catch (error: unknown) {
    if (error instanceof ZodError) return validationErrorResponse(response, error);
    if (error instanceof ProductServiceError) return serviceErrorResponse(response, error);
    throw error;
  }
};

export const update = async (request: Request, response: Response) => {
  try {
    const id = productIdSchema.parse(request.params.id);
    const input = updateProductSchema.parse(request.body);
    return response.status(200).json(await updateProduct(id, input));
  } catch (error: unknown) {
    if (error instanceof ZodError) return validationErrorResponse(response, error);
    if (error instanceof ProductServiceError) return serviceErrorResponse(response, error);
    throw error;
  }
};

export const deactivate = async (request: Request, response: Response) => {
  try { return response.status(200).json(await deactivateProduct(productIdSchema.parse(request.params.id))); }
  catch (error: unknown) {
    if (error instanceof ZodError) return validationErrorResponse(response, error);
    if (error instanceof ProductServiceError) return serviceErrorResponse(response, error);
    throw error;
  }
};
