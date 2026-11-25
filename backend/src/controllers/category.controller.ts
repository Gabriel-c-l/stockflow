import type { Request, Response } from "express";
import { ZodError } from "zod";
import { categoryIdSchema, createCategorySchema, updateCategorySchema } from "../types/category";
import { CategoryServiceError, createCategory, deactivateCategory, getCategoryById, listCategories, updateCategory } from "../services/category.service";

const invalid = (res: Response, error: ZodError) => res.status(400).json({ error: "Invalid request data.", details: error.issues });
const serviceError = (res: Response, error: CategoryServiceError) => res.status(error.code === "NOT_FOUND" ? 404 : error.code === "DUPLICATE_NAME" || error.code === "IN_USE" ? 409 : 400).json({ error: error.message });
export const create = async (req: Request, res: Response) => { try { return res.status(201).json(await createCategory(createCategorySchema.parse(req.body))); } catch (e) { if (e instanceof ZodError) return invalid(res,e); if (e instanceof CategoryServiceError) return serviceError(res,e); throw e; } };
export const list = async (req: Request, res: Response) => {
  const status = req.query.status === undefined ? "active" : req.query.status;
  if (status !== "active" && status !== "inactive" && status !== "all") return res.status(400).json({ error: "Invalid status." });
  return res.status(200).json(await listCategories(status));
};
export const getById = async (req: Request, res: Response) => { try { return res.status(200).json(await getCategoryById(categoryIdSchema.parse(req.params.id))); } catch (e) { if (e instanceof ZodError) return invalid(res,e); if (e instanceof CategoryServiceError) return serviceError(res,e); throw e; } };
export const update = async (req: Request, res: Response) => { try { const id = categoryIdSchema.parse(req.params.id); return res.status(200).json(await updateCategory(id, updateCategorySchema.parse(req.body))); } catch (e) { if (e instanceof ZodError) return invalid(res,e); if (e instanceof CategoryServiceError) return serviceError(res,e); throw e; } };
export const deactivate = async (req: Request, res: Response) => { try { return res.status(200).json(await deactivateCategory(categoryIdSchema.parse(req.params.id))); } catch (e) { if (e instanceof ZodError) return invalid(res,e); if (e instanceof CategoryServiceError) return serviceError(res,e); throw e; } };
