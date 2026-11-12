import { z } from "zod";

export const createStockMovementSchema = z
  .object({
    productId: z.string().uuid("Product ID must be a valid UUID."),
    type: z.enum(["ENTRY", "EXIT"]),
    quantity: z.number().int().positive("Quantity must be greater than zero."),
    notes: z.string().optional(),
  })
  .strict();

export type CreateStockMovementInput = z.infer<
  typeof createStockMovementSchema
>;
