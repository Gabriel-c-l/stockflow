import type { Request, Response } from "express";
import { ZodError } from "zod";
import { createUserSchema, updateUserSchema } from "../types/user";
import * as service from "../services/user.service";
import { UserServiceError } from "../services/user.service";

const handleError = (error: unknown, response: Response) => {
  if (error instanceof ZodError) return response.status(400).json({ error: "Invalid user data.", details: error.issues });
  if (error instanceof UserServiceError) {
    const status = error.code === "NOT_FOUND" ? 404 : error.code === "EMAIL_TAKEN" ? 409 : 400;
    return response.status(status).json({ error: error.message });
  }
  throw error;
};
export const list = async (_request: Request, response: Response) => response.status(200).json({ users: await service.listUsers() });
export const create = async (request: Request, response: Response) => {
  try { const input = createUserSchema.parse(request.body); return response.status(201).json({ user: await service.createUser(input) }); }
  catch (error) { return handleError(error, response); }
};
export const update = async (request: Request, response: Response) => {
  try {
    if (!request.authUser) return response.status(401).json({ error: "Authentication required." });
    const input = updateUserSchema.parse(request.body);
    const userId = request.params.id;
    if (typeof userId !== "string") return response.status(400).json({ error: "Invalid user ID." });
    return response.status(200).json({ user: await service.updateUser(userId, request.authUser.id, input) });
  } catch (error) { return handleError(error, response); }
};
export const deactivate = async (request: Request, response: Response) => {
  try {
    if (!request.authUser) return response.status(401).json({ error: "Authentication required." });
    const userId = request.params.id;
    if (typeof userId !== "string") return response.status(400).json({ error: "Invalid user ID." });
    const user = await service.updateUser(userId, request.authUser.id, { isActive: false });
    return response.status(200).json({ user });
  } catch (error) { return handleError(error, response); }
};
