import { Prisma } from "../generated/prisma/client";
import * as supplierRepository from "../repositories/supplier.repository";
import type { CreateSupplierInput, UpdateSupplierInput } from "../types/supplier";

export class SupplierServiceError extends Error {
  constructor(public readonly code: "DUPLICATE_TAX_ID" | "NOT_FOUND", message: string) { super(message); }
}

const translateError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") throw new SupplierServiceError("DUPLICATE_TAX_ID", "A supplier with this tax ID already exists.");
    if (error.code === "P2025") throw new SupplierServiceError("NOT_FOUND", "Supplier not found.");
  }
  throw error;
};

export const createSupplier = async (input: CreateSupplierInput) => {
  try { return await supplierRepository.createSupplier(input); }
  catch (error) { return translateError(error); }
};

export const listSuppliers = (status: "active" | "inactive" | "all" = "active") => supplierRepository.listSuppliers(status);

export const getSupplierById = async (id: string) => {
  const supplier = await supplierRepository.findSupplierById(id);
  if (!supplier) throw new SupplierServiceError("NOT_FOUND", "Supplier not found.");
  return supplier;
};

export const assertSupplierIsActive = async (id?: string | null) => {
  if (!id) return;
  const supplier = await supplierRepository.findSupplierById(id);
  if (!supplier || !supplier.isActive) throw new SupplierServiceError("NOT_FOUND", "Active supplier not found.");
};

export const updateSupplier = async (id: string, input: UpdateSupplierInput) => {
  try { return await supplierRepository.updateSupplier(id, input); }
  catch (error) { return translateError(error); }
};

export const deactivateSupplier = async (id: string) => {
  try { return await supplierRepository.deactivateSupplier(id); }
  catch (error) { return translateError(error); }
};
