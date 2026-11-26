import { z } from "zod";

const taxIdSchema = z.string().trim().transform((value) => value.replace(/\D/g, "")).pipe(
  z.union([z.literal(""), z.string().regex(/^(\d{11}|\d{14})$/, "Tax ID must contain 11 or 14 digits.")]),
).transform((value) => value || undefined);

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1).max(160),
  taxId: taxIdSchema.optional(),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(240).optional(),
  notes: z.string().trim().max(2000).optional(),
}).strict();

export const updateSupplierSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  taxId: taxIdSchema.nullable().optional(),
  email: z.string().trim().email().max(254).nullable().optional().or(z.literal("")),
  phone: z.string().trim().max(40).nullable().optional(),
  address: z.string().trim().max(240).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const supplierIdSchema = z.string().uuid("Supplier ID must be a valid UUID.");
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
