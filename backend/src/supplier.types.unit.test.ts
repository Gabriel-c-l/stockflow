import { describe, expect, it } from "vitest";
import { createSupplierSchema, supplierIdSchema, updateSupplierSchema } from "./types/supplier";

describe("Supplier schemas", () => {
  it("trims supplier names and normalizes formatted CPF/CNPJ", () => {
    expect(createSupplierSchema.parse({ name: " Acme ", taxId: "12.345.678/0001-90" })).toMatchObject({
      name: "Acme", taxId: "12345678000190",
    });
  });

  it("accepts an empty tax ID as omitted", () => {
    expect(createSupplierSchema.parse({ name: "Acme", taxId: "" })).toEqual({ name: "Acme", taxId: undefined });
  });

  it.each(["123", "1234567890", "123456789012", "123456789012345"])("rejects invalid tax ID %s", (taxId) => {
    expect(createSupplierSchema.safeParse({ name: "Acme", taxId }).success).toBe(false);
  });

  it("rejects blank names, malformed emails and unknown properties", () => {
    expect(createSupplierSchema.safeParse({ name: " " }).success).toBe(false);
    expect(createSupplierSchema.safeParse({ name: "Acme", email: "not-an-email" }).success).toBe(false);
    expect(createSupplierSchema.safeParse({ name: "Acme", unexpected: true }).success).toBe(false);
  });

  it("allows clearing nullable update fields", () => {
    expect(updateSupplierSchema.parse({ taxId: null, email: null, phone: null })).toEqual({
      taxId: null, email: null, phone: null,
    });
  });

  it("rejects empty updates and invalid update values", () => {
    expect(updateSupplierSchema.safeParse({}).success).toBe(false);
    expect(updateSupplierSchema.safeParse({ email: "bad" }).success).toBe(false);
    expect(updateSupplierSchema.safeParse({ unexpected: "value" }).success).toBe(false);
  });

  it("validates supplier UUIDs", () => {
    expect(supplierIdSchema.safeParse("00000000-0000-4000-8000-000000000001").success).toBe(true);
    expect(supplierIdSchema.safeParse("not-a-uuid").success).toBe(false);
  });
});
