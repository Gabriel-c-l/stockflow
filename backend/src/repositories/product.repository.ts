import { prisma } from "../config/database";
import type { CreateProductInput } from "../types/product";

export const createProduct = (data: CreateProductInput) =>
  prisma.product.create({
    data: {
      sku: data.sku,
      name: data.name,
      description: data.description ?? null,
      minStock: data.minStock,
    },
  });

export const findProducts = () =>
  prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

export const findProductById = (id: string) =>
  prisma.product.findUnique({
    where: { id },
  });
