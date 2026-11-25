import { z } from "zod";

export const productUnits = ["UN", "CX", "PCT", "KG", "G", "L", "ML", "M", "CM"] as const;

export const createProductSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required.").max(64),
  name: z.string().trim().min(1, "Name is required.").max(160),
  description: z.string().trim().max(2000).optional(),
  minStock: z.number().int().min(0, "minStock cannot be negative.").default(0),
  categoryId: z.string().uuid().nullable().optional(),
  unit: z.enum(productUnits).default("UN"),
  location: z.string().trim().max(120).nullable().optional(),
}).strict();

export const updateProductSchema = z.object({
  sku: z.string().trim().min(1).max(64).optional(),
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  minStock: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  unit: z.enum(productUnits).optional(),
  location: z.string().trim().max(120).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const listProductsQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  status: z.enum(["active", "inactive", "all"]).default("active"),
  categoryId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const productIdSchema = z.string().uuid("Product ID must be a valid UUID.");
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
