import { Prisma } from "../generated/prisma/client";
import * as categoryRepository from "../repositories/category.repository";
import { prisma } from "../config/database";
import type { CreateCategoryInput, UpdateCategoryInput } from "../types/category";

export class CategoryServiceError extends Error {
  constructor(public readonly code: "DUPLICATE_NAME" | "NOT_FOUND" | "IN_USE", message: string) { super(message); }
}
const translateError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") throw new CategoryServiceError("DUPLICATE_NAME", "A category with this name already exists.");
    if (error.code === "P2025") throw new CategoryServiceError("NOT_FOUND", "Category not found.");
  }
  throw error;
};
export const createCategory = async (input: CreateCategoryInput) => { try { return await categoryRepository.createCategory(input); } catch (error) { return translateError(error); } };
export const listCategories = (status: "active" | "inactive" | "all" = "active") => categoryRepository.listCategories(status);
export const getCategoryById = async (id: string) => { const category = await categoryRepository.findCategoryById(id); if (!category) throw new CategoryServiceError("NOT_FOUND", "Category not found."); return category; };
export const updateCategory = async (id: string, input: UpdateCategoryInput) => { try { return await categoryRepository.updateCategory(id, input); } catch (error) { return translateError(error); } };
export const deactivateCategory = async (id: string) => {
  const category = await categoryRepository.findCategoryById(id);
  if (!category) throw new CategoryServiceError("NOT_FOUND", "Category not found.");
  const linkedProducts = await prisma.product.count({ where: { categoryId: id, isActive: true } });
  if (linkedProducts > 0) throw new CategoryServiceError("IN_USE", "Move active products to another category before deactivating this category.");
  try { return await categoryRepository.deactivateCategory(id); } catch (error) { return translateError(error); }
};
export const assertCategoryIsActive = async (categoryId?: string | null) => {
  if (!categoryId) return;
  const category = await categoryRepository.findCategoryById(categoryId);
  if (!category || !category.isActive) throw new CategoryServiceError("NOT_FOUND", "Active category not found.");
};
