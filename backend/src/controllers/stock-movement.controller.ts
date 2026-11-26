import type { Request, Response } from "express";
import { ZodError } from "zod";
import { createStockMovement, listAllStockMovements, listProductMovements, StockMovementServiceError } from "../services/stock-movement.service";
import { createStockMovementSchema } from "../types/stock-movement";
import { productIdSchema } from "../types/product";

const validationErrorResponse = (response: Response, error: ZodError) =>
  response.status(400).json({ error: "Invalid request data.", details: error.issues });

export const create = async (request: Request, response: Response) => {
  try {
    const input = createStockMovementSchema.parse(request.body);
    return response.status(201).json(await createStockMovement(input, request.authUser?.id));
  } catch (error: unknown) {
    if (error instanceof ZodError) return validationErrorResponse(response, error);
    if (error instanceof StockMovementServiceError) {
      if (error.code === "NOT_FOUND" || error.code === "SUPPLIER_NOT_FOUND") return response.status(404).json({ error: error.message });
      return response.status(409).json({ error: error.message });
    }
    throw error;
  }
};

export const listAll = async (_request: Request, response: Response) =>
  response.status(200).json(await listAllStockMovements());

export const listByProduct = async (request: Request, response: Response) => {
  try {
    const productId = productIdSchema.parse(request.params.id);
    return response.status(200).json(await listProductMovements(productId));
  } catch (error: unknown) {
    if (error instanceof ZodError) return validationErrorResponse(response, error);
    if (error instanceof StockMovementServiceError && error.code === "NOT_FOUND") return response.status(404).json({ error: error.message });
    throw error;
  }
};
