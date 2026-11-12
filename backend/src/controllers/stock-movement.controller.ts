import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createStockMovement,
  listProductMovements,
  StockMovementServiceError,
} from "../services/stock-movement.service";
import {
  createStockMovementSchema,
} from "../types/stock-movement";
import { productIdSchema } from "../types/product";

const validationErrorResponse = (response: Response, error: ZodError) =>
  response.status(400).json({
    error: "Invalid request data.",
    details: error.issues,
  });

export const create = async (request: Request, response: Response) => {
  try {
    const input = createStockMovementSchema.parse(request.body);
    const movement = await createStockMovement(input);

    return response.status(201).json(movement);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return validationErrorResponse(response, error);
    }

    if (error instanceof StockMovementServiceError) {
      if (error.code === "NOT_FOUND") {
        return response.status(404).json({ error: error.message });
      }

      return response.status(409).json({ error: error.message });
    }

    throw error;
  }
};

export const listByProduct = async (
  request: Request,
  response: Response,
) => {
  try {
    const productId = productIdSchema.parse(request.params.id);
    const movements = await listProductMovements(productId);

    return response.status(200).json(movements);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return validationErrorResponse(response, error);
    }

    if (
      error instanceof StockMovementServiceError &&
      error.code === "NOT_FOUND"
    ) {
      return response.status(404).json({ error: error.message });
    }

    throw error;
  }
};
