import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import * as categoryService from "./services/category.service";
import { CategoryServiceError } from "./services/category.service";
import { create, deactivate, getById, list, update } from "./controllers/category.controller";

vi.mock("./services/category.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./services/category.service")>();
  return {
    ...actual,
    createCategory: vi.fn(),
    deactivateCategory: vi.fn(),
    getCategoryById: vi.fn(),
    listCategories: vi.fn(),
    updateCategory: vi.fn(),
  };
});

const service = vi.mocked(categoryService);
const validId = "00000000-0000-4000-8000-000000000001";
const createResponse = () => {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response as unknown as Response;
};
const request = (body: unknown = {}, id = validId, query: Record<string, unknown> = {}) => ({
  body,
  params: { id },
  query,
}) as unknown as Request;

beforeEach(() => vi.clearAllMocks());

describe("Category controller", () => {
  it("creates a category", async () => {
    const category = { id: validId, name: "Tools" };
    service.createCategory.mockResolvedValue(category as never);
    const response = createResponse();
    await create(request({ name: " Tools " }), response);
    expect(service.createCategory).toHaveBeenCalledWith({ name: "Tools" });
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith(category);
  });

  it("rejects invalid create data", async () => {
    const response = createResponse();
    await create(request({ name: "" }), response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid request data." }));
  });

  it.each([
    ["DUPLICATE_NAME", 409],
    ["IN_USE", 409],
    ["NOT_FOUND", 404],
  ] as const)("maps service error %s to HTTP %i", async (code, status) => {
    service.createCategory.mockRejectedValue(new CategoryServiceError(code, "service error"));
    const response = createResponse();
    await create(request({ name: "Tools" }), response);
    expect(response.status).toHaveBeenCalledWith(status);
  });

  it("lists active categories by default", async () => {
    service.listCategories.mockResolvedValue([]);
    const response = createResponse();
    await list(request(), response);
    expect(service.listCategories).toHaveBeenCalledWith("active");
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it.each(["active", "inactive", "all"] as const)("accepts list status %s", async (status) => {
    service.listCategories.mockResolvedValue([]);
    const response = createResponse();
    await list(request({}, validId, { status }), response);
    expect(service.listCategories).toHaveBeenCalledWith(status);
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it("rejects an invalid list status", async () => {
    const response = createResponse();
    await list(request({}, validId, { status: "unknown" }), response);
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it("gets a category by id", async () => {
    const category = { id: validId, name: "Tools" };
    service.getCategoryById.mockResolvedValue(category as never);
    const response = createResponse();
    await getById(request({}, validId), response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(category);
  });

  it("rejects an invalid category id", async () => {
    const response = createResponse();
    await getById(request({}, "invalid"), response);
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it("maps missing category on get to 404", async () => {
    service.getCategoryById.mockRejectedValue(new CategoryServiceError("NOT_FOUND", "missing"));
    const response = createResponse();
    await getById(request(), response);
    expect(response.status).toHaveBeenCalledWith(404);
  });

  it("updates a category", async () => {
    const category = { id: validId, name: "New name" };
    service.updateCategory.mockResolvedValue(category as never);
    const response = createResponse();
    await update(request({ name: "New name" }), response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(service.updateCategory).toHaveBeenCalledWith(validId, { name: "New name" });
  });

  it("rejects an empty update", async () => {
    const response = createResponse();
    await update(request({}), response);
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it("deactivates a category", async () => {
    const category = { id: validId, isActive: false };
    service.deactivateCategory.mockResolvedValue(category as never);
    const response = createResponse();
    await deactivate(request(), response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(category);
  });

  it("rejects invalid id on deactivate", async () => {
    const response = createResponse();
    await deactivate(request({}, "bad-id"), response);
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it("maps an in-use category error on deactivate to 409", async () => {
    service.deactivateCategory.mockRejectedValue(new CategoryServiceError("IN_USE", "category is in use"));
    const response = createResponse();
    await deactivate(request(), response);
    expect(response.status).toHaveBeenCalledWith(409);
  });

  it("maps a missing category error on update to 404", async () => {
    service.updateCategory.mockRejectedValue(new CategoryServiceError("NOT_FOUND", "missing"));
    const response = createResponse();
    await update(request({ name: "Updated" }), response);
    expect(response.status).toHaveBeenCalledWith(404);
  });

  it("maps duplicate category name on update to 409", async () => {
    service.updateCategory.mockRejectedValue(new CategoryServiceError("DUPLICATE_NAME", "duplicate"));
    const response = createResponse();
    await update(request({ name: "Duplicate" }), response);
    expect(response.status).toHaveBeenCalledWith(409);
  });
});
