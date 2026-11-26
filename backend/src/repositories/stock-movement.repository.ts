import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/database";
import type { CreateStockMovementInput } from "../types/stock-movement";

type DatabaseClient = Prisma.TransactionClient;
type CreateStockMovementWithActor = CreateStockMovementInput & { performedById?: string };

export const findProductById = (client: DatabaseClient, productId: string) =>
  client.product.findUnique({ where: { id: productId }, select: { id: true } });

export const increaseProductQuantity = (client: DatabaseClient, productId: string, quantity: number) =>
  client.product.update({ where: { id: productId }, data: { quantity: { increment: quantity } } });

export const decreaseProductQuantity = (client: DatabaseClient, productId: string, quantity: number) =>
  client.product.updateMany({ where: { id: productId, quantity: { gte: quantity } }, data: { quantity: { decrement: quantity } } });

export const createStockMovement = (client: DatabaseClient, data: CreateStockMovementWithActor) =>
  client.stockMovement.create({ data: {
    productId: data.productId, type: data.type, quantity: data.quantity,
    notes: data.notes ?? null, performedById: data.performedById ?? null,
    supplierId: data.supplierId ?? null, recipient: data.recipient ?? null,
    unitCost: data.unitCost ?? null,
  } });

export const findMovementsByProductId = (productId: string) =>
  prisma.stockMovement.findMany({
    where: { productId }, orderBy: { createdAt: "desc" },
    include: { supplier: { select: { id: true, name: true, taxId: true } } },
  });

export const findProductForHistory = (productId: string) =>
  prisma.product.findUnique({ where: { id: productId }, select: { id: true } });

export const findAllMovements = () =>
  prisma.stockMovement.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, sku: true, name: true, unit: true } },
      performedBy: { select: { id: true, name: true, email: true } },
      supplier: { select: { id: true, name: true, taxId: true } },
    },
  });
