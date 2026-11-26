import { prisma } from "../config/database";
import type { CreateSupplierInput, UpdateSupplierInput } from "../types/supplier";

export const createSupplier = (data: CreateSupplierInput) => prisma.supplier.create({
  data: {
    name: data.name,
    taxId: data.taxId ?? null,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    notes: data.notes || null,
  },
});

export const listSuppliers = (status: "active" | "inactive" | "all" = "active") => prisma.supplier.findMany({
  where: status === "all" ? {} : { isActive: status === "active" },
  orderBy: [{ name: "asc" }],
});

export const findSupplierById = (id: string) => prisma.supplier.findUnique({ where: { id } });

export const updateSupplier = (id: string, data: UpdateSupplierInput) => prisma.supplier.update({
  where: { id },
  data: {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.taxId !== undefined ? { taxId: data.taxId || null } : {}),
    ...(data.email !== undefined ? { email: data.email || null } : {}),
    ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
    ...(data.address !== undefined ? { address: data.address || null } : {}),
    ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
  },
});

export const deactivateSupplier = (id: string) => prisma.supplier.update({ where: { id }, data: { isActive: false } });
