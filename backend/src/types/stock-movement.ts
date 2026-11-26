import { z } from "zod";

export const createStockMovementSchema = z.object({
  productId: z.string().uuid("Product ID must be a valid UUID."),
  type: z.enum(["ENTRY", "EXIT"]),
  quantity: z.number().int().positive("Quantity must be greater than zero."),
  supplierId: z.string().uuid("Supplier ID must be a valid UUID.").nullable().optional(),
  recipient: z.string().trim().min(1).max(160).nullable().optional(),
  unitCost: z.number().finite().min(0, "Unit cost cannot be negative.").optional(),
  notes: z.string().trim().max(2000).optional(),
}).strict().superRefine((value, context) => {
  if (value.type === "EXIT" && (value.supplierId || value.unitCost !== undefined)) {
    context.addIssue({ code: "custom", message: "Supplier and unit cost can only be provided for ENTRY movements.", path: ["supplierId"] });
  }
  if (value.type === "ENTRY" && value.recipient) {
    context.addIssue({ code: "custom", message: "Recipient can only be provided for EXIT movements.", path: ["recipient"] });
  }
});

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
