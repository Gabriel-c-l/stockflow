import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import * as supplierService from "./services/supplier.service";
import { SupplierServiceError } from "./services/supplier.service";
import { create, deactivate, getById, list, update } from "./controllers/supplier.controller";

vi.mock("./services/supplier.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./services/supplier.service")>();
  return {
    ...actual,
    createSupplier: vi.fn(),
    deactivateSupplier: vi.fn(),
    getSupplierById: vi.fn(),
    listSuppliers: vi.fn(),
    updateSupplier: vi.fn(),
  };
});

const service = vi.mocked(supplierService);
const validId = "00000000-0000-4000-8000-000000000001";
const createResponse = () => {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response as unknown as Response;
};
const request = (body: unknown = {}, id = validId, query: Record<string, unknown> = {}) =>
  ({ body, params: { id }, query }) as unknown as Request;

beforeEach(() => vi.clearAllMocks());

describe("Supplier controller", () => {
  it("creates a supplier and returns 201", async () => {
    const supplier = { id: validId, name: "Acme" };
    service.createSupplier.mockResolvedValue(supplier as never);
    const response = createResponse();
    await create(request({ name: " Acme " }), response);
    expect(service.createSupplier).toHaveBeenCalledWith({ name: "Acme" });
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith(supplier);
  });

  it("returns 400 for invalid create data", async () => {
    const response = createResponse();
    await create(request({ name: "" }), response);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Invalid request data." }));
  });

  it("maps duplicate tax ID to 409 on create", async () => {
    service.createSupplier.mockRejectedValue(new SupplierServiceError("DUPLICATE_TAX_ID", "duplicate"));
    const response = createResponse();
    await create(request({ name: "Acme" }), response);
    expect(response.status).toHaveBeenCalledWith(409);
  });

  it("rethrows unexpected create errors", async () => {
    const error = new Error("database unavailable");
    service.createSupplier.mockRejectedValue(error);
    await expect(create(request({ name: "Acme" }), createResponse())).rejects.toBe(error);
  });

  it("lists active suppliers by default", async () => {
    service.listSuppliers.mockResolvedValue([]);
    const response = createResponse();
    await list(request(), response);
    expect(service.listSuppliers).toHaveBeenCalledWith("active");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([]);
  });

  it.each(["active", "inactive", "all"] as const)("accepts status %s", async (status) => {
    service.listSuppliers.mockResolvedValue([]);
    const response = createResponse();
    await list(request({}, validId, { status }), response);
    expect(service.listSuppliers).toHaveBeenCalledWith(status);
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it("rejects an invalid status", async () => {
    const response = createResponse();
    await list(request({}, validId, { status: "archived" }), response);
    expect(service.listSuppliers).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it("gets a supplier by valid ID", async () => {
    const supplier = { id: validId, name: "Acme" };
    service.getSupplierById.mockResolvedValue(supplier as never);
    const response = createResponse();
    await getById(request({}, validId), response);
    expect(service.getSupplierById).toHaveBeenCalledWith(validId);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(supplier);
  });

  it("rejects invalid ID on get", async () => {
    const response = createResponse();
    await getById(request({}, "invalid"), response);
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it("maps missing supplier on get to 404", async () => {
    service.getSupplierById.mockRejectedValue(new SupplierServiceError("NOT_FOUND", "missing"));
    const response = createResponse();
    await getById(request(), response);
    expect(response.status).toHaveBeenCalledWith(404);
  });

  it("rethrows unexpected get errors", async () => {
    const error = new Error("unexpected");
    service.getSupplierById.mockRejectedValue(error);
    await expect(getById(request(), createResponse())).rejects.toBe(error);
  });

  it("updates a supplier", async () => {
    const supplier = { id: validId, name: "Updated" };
    service.updateSupplier.mockResolvedValue(supplier as never);
    const response = createResponse();
    await update(request({ name: "Updated" }), response);
    expect(service.updateSupplier).toHaveBeenCalledWith(validId, { name: "Updated" });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(supplier);
  });

  it("rejects empty update data", async () => {
    const response = createResponse();
    await update(request({}), response);
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it("rejects invalid ID on update", async () => {
    const response = createResponse();
    await update(request({ name: "Updated" }, "bad-id"), response);
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it("maps duplicate tax ID on update to 409", async () => {
    service.updateSupplier.mockRejectedValue(new SupplierServiceError("DUPLICATE_TAX_ID", "duplicate"));
    const response = createResponse();
    await update(request({ taxId: "12345678901" }), response);
    expect(response.status).toHaveBeenCalledWith(409);
  });

  it("deactivates a supplier", async () => {
    const supplier = { id: validId, isActive: false };
    service.deactivateSupplier.mockResolvedValue(supplier as never);
    const response = createResponse();
    await deactivate(request(), response);
    expect(service.deactivateSupplier).toHaveBeenCalledWith(validId);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(supplier);
  });

  it("rejects invalid ID on deactivate", async () => {
    const response = createResponse();
    await deactivate(request({}, "invalid"), response);
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it("maps missing supplier on deactivate to 404", async () => {
    service.deactivateSupplier.mockRejectedValue(new SupplierServiceError("NOT_FOUND", "missing"));
    const response = createResponse();
    await deactivate(request(), response);
    expect(response.status).toHaveBeenCalledWith(404);
  });

  it("rethrows unexpected deactivate errors", async () => {
    const error = new Error("unexpected");
    service.deactivateSupplier.mockRejectedValue(error);
    await expect(deactivate(request(), createResponse())).rejects.toBe(error);
  });
});
