import { z } from "zod";

export const userRoleSchema = z.enum(["ADMIN", "MANAGER", "OPERATOR"]);
export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).toLowerCase(),
  password: z.string().min(12).max(128),
  role: userRoleSchema,
}).strict();
export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(254).toLowerCase().optional(),
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
