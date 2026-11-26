import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/database";
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from "../types/product";

export const createProduct = (data: CreateProductInput) =>
  prisma.product.create({
    data: {
      sku: data.sku,
      name: data.name,
      description: data.description ?? null,
      price: data.price ?? 0,
      minStock: data.minStock,
      categoryId: data.categoryId ?? null,
      unit: data.unit,
      location: data.location ?? null,
    },
    include: { category: true },
  });

export const findProducts = async (query: ListProductsQuery) => {
  const where: Prisma.ProductWhereInput = {
    ...(query.status === "all" ? {} : { isActive: query.status === "active" }),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.search ? {
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
      ],
    } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({ where, include: { category: true }, orderBy: [{ createdAt: "desc" }, { name: "asc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    prisma.product.count({ where }),
  ]);
  return { items, pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } };
};

export const findProductById = (id: string) => prisma.product.findUnique({ where: { id }, include: { category: true } });
export const updateProduct = (id: string, data: UpdateProductInput) =>
  prisma.product.update({
    where: { id },
    data: {
      ...(data.sku !== undefined ? { sku: data.sku } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.minStock !== undefined ? { minStock: data.minStock } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      ...(data.unit !== undefined ? { unit: data.unit } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
    },
    include: { category: true },
  });
export const deactivateProduct = (id: string) => prisma.product.update({ where: { id }, data: { isActive: false }, include: { category: true } });
