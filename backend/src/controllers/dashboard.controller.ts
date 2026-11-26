import type { Request, Response } from "express";
import { getDashboardSummary } from "../services/dashboard.service";

export const summary = async (_request: Request, response: Response) =>
  response.status(200).json(await getDashboardSummary());
