import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "./generated/prisma/client";
import * as repository from "./repositories/category.repository";
import { prisma } from "./config/database";
import {
  assertCategoryIsActive,
  CategoryServiceError,
  createCategory,
  deactivateCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from "./services/category.service";

vi.mock("./repositories/category.repository", () => ({
  createCategory: vi.fn(),
  listCategories: vi.fn(),
  findCategoryById: vi.fn(),
  updateCategory: vi.fn(),
  deactivateCategory: vi.fn(),
}));
vi.mock("./config/database", () => ({
  prisma: { product: { count: vi.fn() } },
}));

const repo = vi.mocked(repository);
const productCount = vi.mocked(prisma.product.count);
const category = { id: "00000000-0000-4000-8000-000000000001", name: "Tools", isActive: true };
const prismaError = (code: string) => new Prisma.PrismaClientKnownRequestError("Database error", {
  code,
  clientVersion: "unit-test",
});

beforeEach(() => vi.clearAllMocks());

describe("Category service", () => {
  it("creates a category", async () => {
    repo.createCategory.mockResolvedValue(category as never);
    await expect(createCategory({ name: "Tools" })).resolves.toEqual(category);
  });

  it("translates duplicate-name database errors", async () => {
    repo.createCategory.mockRejectedValue(prismaError("P2002"));
    await expect(createCategory({ name: "Tools" })).rejects.toMatchObject({ code: "DUPLICATE_NAME" });
  });

  it("translates missing-record database errors on create only when returned by Prisma", async () => {
    repo.createCategory.mockRejectedValue(prismaError("P2025"));
    await expect(createCategory({ name: "Tools" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rethrows unknown database errors", async () => {
    const error = new Error("connection failed");
    repo.createCategory.mockRejectedValue(error);
    await expect(createCategory({ name: "Tools" })).rejects.toBe(error);
  });

  it("lists categories using the requested status", async () => {
    repo.listCategories.mockResolvedValue([category] as never);
    await expect(listCategories("inactive")).resolves.toEqual([category]);
    expect(repo.listCategories).toHaveBeenCalledWith("inactive");
  });

  it("gets an existing category", async () => {
    repo.findCategoryById.mockResolvedValue(category as never);
    await expect(getCategoryById(category.id)).resolves.toEqual(category);
  });

  it("throws NOT_FOUND when get cannot find a category", async () => {
    repo.findCategoryById.mockResolvedValue(null);
    await expect(getCategoryById(category.id)).rejects.toBeInstanceOf(CategoryServiceError);
  });

  it("updates a category", async () => {
    repo.updateCategory.mockResolvedValue({ ...category, name: "Updated" } as never);
    await expect(updateCategory(category.id, { name: "Updated" })).resolves.toMatchObject({ name: "Updated" });
  });

  it("translates duplicate update errors", async () => {
    repo.updateCategory.mockRejectedValue(prismaError("P2002"));
    await expect(updateCategory(category.id, { name: "Tools" })).rejects.toMatchObject({ code: "DUPLICATE_NAME" });
  });

  it("translates missing update errors", async () => {
    repo.updateCategory.mockRejectedValue(prismaError("P2025"));
    await expect(updateCategory(category.id, { name: "Tools" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("deactivates a category with no active linked products", async () => {
    repo.findCategoryById.mockResolvedValue(category as never);
    productCount.mockResolvedValue(0);
    repo.deactivateCategory.mockResolvedValue({ ...category, isActive: false } as never);
    await expect(deactivateCategory(category.id)).resolves.toMatchObject({ isActive: false });
  });

  it("does not deactivate a category with active linked products", async () => {
    repo.findCategoryById.mockResolvedValue(category as never);
    productCount.mockResolvedValue(2);
    await expect(deactivateCategory(category.id)).rejects.toMatchObject({ code: "IN_USE" });
    expect(repo.deactivateCategory).not.toHaveBeenCalled();
  });

  it("does not deactivate a missing category", async () => {
    repo.findCategoryById.mockResolvedValue(null);
    await expect(deactivateCategory(category.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(productCount).not.toHaveBeenCalled();
  });

  it("translates a missing record during deactivation", async () => {
    repo.findCategoryById.mockResolvedValue(category as never);
    productCount.mockResolvedValue(0);
    repo.deactivateCategory.mockRejectedValue(prismaError("P2025"));
    await expect(deactivateCategory(category.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("accepts an omitted category id", async () => {
    await expect(assertCategoryIsActive(undefined)).resolves.toBeUndefined();
    expect(repo.findCategoryById).not.toHaveBeenCalled();
  });

  it("accepts a null category id", async () => {
    await expect(assertCategoryIsActive(null)).resolves.toBeUndefined();
  });

  it("accepts an active category", async () => {
    repo.findCategoryById.mockResolvedValue(category as never);
    await expect(assertCategoryIsActive(category.id)).resolves.toBeUndefined();
  });

  it("rejects a missing category reference", async () => {
    repo.findCategoryById.mockResolvedValue(null);
    await expect(assertCategoryIsActive(category.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects an inactive category reference", async () => {
    repo.findCategoryById.mockResolvedValue({ ...category, isActive: false } as never);
    await expect(assertCategoryIsActive(category.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
