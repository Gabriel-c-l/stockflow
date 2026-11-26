import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "./config/database";
import { createSupplier, deactivateSupplier, findSupplierById, listSuppliers, updateSupplier } from "./repositories/supplier.repository";

vi.mock("./config/database", () => ({
  prisma: { supplier: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() } },
}));

const db = vi.mocked(prisma.supplier);
const id = "00000000-0000-4000-8000-000000000001";

beforeEach(() => vi.clearAllMocks());

describe("Supplier repository", () => {
  it("creates a supplier and normalizes omitted optional fields to null", async () => {
    db.create.mockResolvedValue({ id, name: "Acme" } as never);
    await createSupplier({ name: "Acme" });
    expect(db.create).toHaveBeenCalledWith({ data: {
      name: "Acme", taxId: null, email: null, phone: null, address: null, notes: null,
    } });
  });

  it("preserves provided supplier contact fields", async () => {
    db.create.mockResolvedValue({ id, name: "Acme" } as never);
    await createSupplier({
      name: "Acme", taxId: "12345678901", email: "a@b.com",
      phone: "123", address: "Street", notes: "Preferred",
    });
    expect(db.create).toHaveBeenCalledWith({ data: {
      name: "Acme", taxId: "12345678901", email: "a@b.com", phone: "123", address: "Street", notes: "Preferred",
    } });
  });

  it("lists all suppliers without an active filter", async () => {
    db.findMany.mockResolvedValue([] as never);
    await listSuppliers("all");
    expect(db.findMany).toHaveBeenCalledWith({ where: {}, orderBy: [{ name: "asc" }] });
  });

  it("filters active and inactive suppliers", async () => {
    db.findMany.mockResolvedValue([] as never);
    await listSuppliers("active");
    expect(db.findMany).toHaveBeenLastCalledWith({ where: { isActive: true }, orderBy: [{ name: "asc" }] });
    await listSuppliers("inactive");
    expect(db.findMany).toHaveBeenLastCalledWith({ where: { isActive: false }, orderBy: [{ name: "asc" }] });
  });

  it("finds a supplier by ID", async () => {
    db.findUnique.mockResolvedValue({ id, name: "Acme" } as never);
    await findSupplierById(id);
    expect(db.findUnique).toHaveBeenCalledWith({ where: { id } });
  });

  it("updates only supplied fields", async () => {
    db.update.mockResolvedValue({ id, name: "New name" } as never);
    await updateSupplier(id, { name: "New name", phone: "123" });
    expect(db.update).toHaveBeenCalledWith({ where: { id }, data: { name: "New name", phone: "123" } });
  });

  it("normalizes empty optional update fields to null", async () => {
    db.update.mockResolvedValue({ id } as never);
    await updateSupplier(id, { taxId: "", email: "", phone: "", address: "", notes: "" });
    expect(db.update).toHaveBeenCalledWith({
      where: { id }, data: { taxId: null, email: null, phone: null, address: null, notes: null },
    });
  });

  it("deactivates without deleting the supplier", async () => {
    db.update.mockResolvedValue({ id, isActive: false } as never);
    await deactivateSupplier(id);
    expect(db.update).toHaveBeenCalledWith({ where: { id }, data: { isActive: false } });
  });
});
