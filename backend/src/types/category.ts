import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  description: z.string().trim().max(1000).nullable().optional(),
}).strict();

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const categoryIdSchema = z.string().uuid("Category ID must be a valid UUID.");
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
