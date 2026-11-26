import { Router } from "express";
import * as stockMovementController from "../controllers/stock-movement.controller";

export const stockMovementRouter = Router();
stockMovementRouter.get("/", stockMovementController.listAll);
stockMovementRouter.post("/", stockMovementController.create);
