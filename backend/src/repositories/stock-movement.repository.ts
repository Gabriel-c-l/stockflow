import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/database";
import type { CreateStockMovementInput } from "../types/stock-movement";

type DatabaseClient = Prisma.TransactionClient;

export const findProductById = (client: DatabaseClient, productId: string) =>
  client.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

export const increaseProductQuantity = (
  client: DatabaseClient,
  productId: string,
  quantity: number,
) =>
  client.product.update({
    where: { id: productId },
    data: { quantity: { increment: quantity } },
  });

export const decreaseProductQuantity = (
  client: DatabaseClient,
  productId: string,
  quantity: number,
) =>
  client.product.updateMany({
    where: {
      id: productId,
      quantity: { gte: quantity },
    },
    data: { quantity: { decrement: quantity } },
  });

export const createStockMovement = (
  client: DatabaseClient,
  data: CreateStockMovementInput,
) =>
  client.stockMovement.create({
    data: {
      productId: data.productId,
      type: data.type,
      quantity: data.quantity,
      notes: data.notes ?? null,
    },
  });

export const findMovementsByProductId = (productId: string) =>
  prisma.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });

export const findProductForHistory = (productId: string) =>
  prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
