import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.string().trim().max(254).email("A valid email is required.").toLowerCase(),
    password: z.string().min(1, "Password is required.").max(128, "Password is too long."),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "OPERATOR";
  language: "pt-BR" | "en";
  isActive: boolean;
  createdAt: Date;
};
