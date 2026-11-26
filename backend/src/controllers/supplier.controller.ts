import type { Request, Response } from "express";
import { ZodError } from "zod";
import { createSupplier, deactivateSupplier, getSupplierById, listSuppliers, SupplierServiceError, updateSupplier } from "../services/supplier.service";
import { createSupplierSchema, supplierIdSchema, updateSupplierSchema } from "../types/supplier";

const invalid = (response: Response, error: ZodError) => response.status(400).json({ error: "Invalid request data.", details: error.issues });
const serviceError = (response: Response, error: SupplierServiceError) => response.status(error.code === "NOT_FOUND" ? 404 : 409).json({ error: error.message });

export const create = async (request: Request, response: Response) => {
  try { return response.status(201).json(await createSupplier(createSupplierSchema.parse(request.body))); }
  catch (error) { if (error instanceof ZodError) return invalid(response, error); if (error instanceof SupplierServiceError) return serviceError(response, error); throw error; }
};

export const list = async (request: Request, response: Response) => {
  const status = request.query.status === undefined ? "active" : request.query.status;
  if (status !== "active" && status !== "inactive" && status !== "all") return response.status(400).json({ error: "Invalid status." });
  return response.status(200).json(await listSuppliers(status));
};

export const getById = async (request: Request, response: Response) => {
  try { return response.status(200).json(await getSupplierById(supplierIdSchema.parse(request.params.id))); }
  catch (error) { if (error instanceof ZodError) return invalid(response, error); if (error instanceof SupplierServiceError) return serviceError(response, error); throw error; }
};

export const update = async (request: Request, response: Response) => {
  try { return response.status(200).json(await updateSupplier(supplierIdSchema.parse(request.params.id), updateSupplierSchema.parse(request.body))); }
  catch (error) { if (error instanceof ZodError) return invalid(response, error); if (error instanceof SupplierServiceError) return serviceError(response, error); throw error; }
};

export const deactivate = async (request: Request, response: Response) => {
  try { return response.status(200).json(await deactivateSupplier(supplierIdSchema.parse(request.params.id))); }
  catch (error) { if (error instanceof ZodError) return invalid(response, error); if (error instanceof SupplierServiceError) return serviceError(response, error); throw error; }
};
