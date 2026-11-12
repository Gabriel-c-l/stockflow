import { Router } from "express";
import * as stockMovementController from "../controllers/stock-movement.controller";

export const stockMovementRouter = Router();

stockMovementRouter.post("/", stockMovementController.create);
