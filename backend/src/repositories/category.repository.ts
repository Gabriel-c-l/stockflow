import { prisma } from "../config/database";
import type { CreateCategoryInput, UpdateCategoryInput } from "../types/category";

export const createCategory = (data: CreateCategoryInput) => prisma.category.create({ data: { name: data.name, description: data.description ?? null } });
export const listCategories = (status: "active" | "inactive" | "all" = "active") => prisma.category.findMany({ where: status === "all" ? {} : { isActive: status === "active" }, orderBy: [{ name: "asc" }] });
export const findCategoryById = (id: string) => prisma.category.findUnique({ where: { id } });
export const updateCategory = (id: string, data: UpdateCategoryInput) =>
  prisma.category.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
    },
  });
export const deactivateCategory = (id: string) => prisma.category.update({ where: { id }, data: { isActive: false } });
