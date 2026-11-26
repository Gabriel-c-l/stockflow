import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "./generated/prisma/client";
import * as repository from "./repositories/supplier.repository";
import { assertSupplierIsActive, createSupplier, deactivateSupplier, getSupplierById, listSuppliers, SupplierServiceError, updateSupplier } from "./services/supplier.service";

vi.mock("./repositories/supplier.repository", () => ({
  createSupplier: vi.fn(),
  listSuppliers: vi.fn(),
  findSupplierById: vi.fn(),
  updateSupplier: vi.fn(),
  deactivateSupplier: vi.fn(),
}));

const repo = vi.mocked(repository);
const supplier = { id: "00000000-0000-4000-8000-000000000001", name: "Acme", taxId: "12345678901", isActive: true };
const prismaError = (code: string) => new Prisma.PrismaClientKnownRequestError("Database error", { code, clientVersion: "unit-test" });

beforeEach(() => vi.clearAllMocks());

describe("Supplier service", () => {
  it("creates a supplier", async () => {
    repo.createSupplier.mockResolvedValue(supplier as never);
    await expect(createSupplier({ name: "Acme" })).resolves.toEqual(supplier);
  });

  it("translates duplicate tax ID errors", async () => {
    repo.createSupplier.mockRejectedValue(prismaError("P2002"));
    await expect(createSupplier({ name: "Acme" })).rejects.toMatchObject({ code: "DUPLICATE_TAX_ID" });
  });

  it("lists suppliers by status", async () => {
    repo.listSuppliers.mockResolvedValue([supplier] as never);
    await expect(listSuppliers("active")).resolves.toEqual([supplier]);
    expect(repo.listSuppliers).toHaveBeenCalledWith("active");
  });

  it("returns a supplier by ID", async () => {
    repo.findSupplierById.mockResolvedValue(supplier as never);
    await expect(getSupplierById(supplier.id)).resolves.toEqual(supplier);
  });

  it("rejects missing or inactive suppliers for stock entries", async () => {
    repo.findSupplierById.mockResolvedValue(null);
    await expect(assertSupplierIsActive(supplier.id)).rejects.toEqual(new SupplierServiceError("NOT_FOUND", "Active supplier not found."));
    repo.findSupplierById.mockResolvedValue({ ...supplier, isActive: false } as never);
    await expect(assertSupplierIsActive(supplier.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("updates a supplier", async () => {
    repo.updateSupplier.mockResolvedValue({ ...supplier, name: "Acme Updated" } as never);
    await expect(updateSupplier(supplier.id, { name: "Acme Updated" })).resolves.toMatchObject({ name: "Acme Updated" });
  });

  it("deactivates a supplier without deleting its movement history", async () => {
    repo.deactivateSupplier.mockResolvedValue({ ...supplier, isActive: false } as never);
    await expect(deactivateSupplier(supplier.id)).resolves.toMatchObject({ isActive: false });
  });

  it("translates missing-record errors on update and deactivate", async () => {
    repo.updateSupplier.mockRejectedValue(prismaError("P2025"));
    await expect(updateSupplier(supplier.id, { name: "Updated" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    repo.deactivateSupplier.mockRejectedValue(prismaError("P2025"));
    await expect(deactivateSupplier(supplier.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rethrows unknown repository errors", async () => {
    const error = new Error("connection failed");
    repo.createSupplier.mockRejectedValue(error);
    await expect(createSupplier({ name: "Acme" })).rejects.toBe(error);
    repo.updateSupplier.mockRejectedValue(error);
    await expect(updateSupplier(supplier.id, { name: "Updated" })).rejects.toBe(error);
    repo.deactivateSupplier.mockRejectedValue(error);
    await expect(deactivateSupplier(supplier.id)).rejects.toBe(error);
  });

  it("does not query when supplier ID is omitted", async () => {
    await expect(assertSupplierIsActive(undefined)).resolves.toBeUndefined();
    await expect(assertSupplierIsActive(null)).resolves.toBeUndefined();
    expect(repo.findSupplierById).not.toHaveBeenCalled();
  });

  it("accepts an active supplier", async () => {
    repo.findSupplierById.mockResolvedValue(supplier as never);
    await expect(assertSupplierIsActive(supplier.id)).resolves.toBeUndefined();
  });

  it("throws NOT_FOUND when get cannot find a supplier", async () => {
    repo.findSupplierById.mockResolvedValue(null);
    await expect(getSupplierById(supplier.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

});
