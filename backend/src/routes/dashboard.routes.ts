import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";

export const dashboardRouter = Router();
dashboardRouter.get("/summary", dashboardController.summary);
