import { prisma } from "../config/database";
import * as stockMovementRepository from "../repositories/stock-movement.repository";
import type { CreateStockMovementInput } from "../types/stock-movement";

export class StockMovementServiceError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "INSUFFICIENT_STOCK",
    message: string,
  ) {
    super(message);
  }
}

export const createStockMovement = (input: CreateStockMovementInput) =>
  prisma.$transaction(async (transaction) => {
    const product = await stockMovementRepository.findProductById(
      transaction,
      input.productId,
    );

    if (!product) {
      throw new StockMovementServiceError(
        "NOT_FOUND",
        "Product not found.",
      );
    }

    if (input.type === "ENTRY") {
      await stockMovementRepository.increaseProductQuantity(
        transaction,
        input.productId,
        input.quantity,
      );
    } else {
      const update = await stockMovementRepository.decreaseProductQuantity(
        transaction,
        input.productId,
        input.quantity,
      );

      if (update.count === 0) {
        throw new StockMovementServiceError(
          "INSUFFICIENT_STOCK",
          "Insufficient stock.",
        );
      }
    }

    return stockMovementRepository.createStockMovement(transaction, input);
  });

export const listProductMovements = async (productId: string) => {
  const product = await stockMovementRepository.findProductForHistory(productId);

  if (!product) {
    throw new StockMovementServiceError("NOT_FOUND", "Product not found.");
  }

  return stockMovementRepository.findMovementsByProductId(productId);
};
