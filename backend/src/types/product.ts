import { z } from "zod";

export const createProductSchema = z
  .object({
    sku: z.string().trim().min(1, "SKU is required."),
    name: z.string().trim().min(1, "Name is required."),
    description: z.string().optional(),
    minStock: z.number().int().min(0, "minStock cannot be negative.").default(0),
  })
  .strict();

export const productIdSchema = z.string().uuid("Product ID must be a valid UUID.");

export type CreateProductInput = z.infer<typeof createProductSchema>;
