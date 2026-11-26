import { prisma } from "../config/database";
import * as stockMovementRepository from "../repositories/stock-movement.repository";
import type { CreateStockMovementInput } from "../types/stock-movement";
import { assertSupplierIsActive, SupplierServiceError } from "./supplier.service";

export class StockMovementServiceError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INSUFFICIENT_STOCK" | "SUPPLIER_NOT_FOUND", message: string) { super(message); }
}

export const createStockMovement = (input: CreateStockMovementInput, performedById?: string) =>
  prisma.$transaction(async (transaction) => {
    const product = await stockMovementRepository.findProductById(transaction, input.productId);
    if (input.type === "ENTRY" && input.supplierId) {
      try { await assertSupplierIsActive(input.supplierId); }
      catch (error) { if (error instanceof SupplierServiceError) throw new StockMovementServiceError("SUPPLIER_NOT_FOUND", error.message); throw error; }
    }
    if (!product) throw new StockMovementServiceError("NOT_FOUND", "Product not found.");
    if (input.type === "ENTRY") {
      await stockMovementRepository.increaseProductQuantity(transaction, input.productId, input.quantity);
    } else {
      const update = await stockMovementRepository.decreaseProductQuantity(transaction, input.productId, input.quantity);
      if (update.count === 0) throw new StockMovementServiceError("INSUFFICIENT_STOCK", "Insufficient stock.");
    }
    return stockMovementRepository.createStockMovement(transaction, { ...input, ...(performedById ? { performedById } : {}) });
  });

export const listProductMovements = async (productId: string) => {
  const product = await stockMovementRepository.findProductForHistory(productId);
  if (!product) throw new StockMovementServiceError("NOT_FOUND", "Product not found.");
  return stockMovementRepository.findMovementsByProductId(productId);
};

export const listAllStockMovements = () => stockMovementRepository.findAllMovements();
