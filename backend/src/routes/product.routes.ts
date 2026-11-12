import { Router } from "express";
import * as productController from "../controllers/product.controller";
import * as stockMovementController from "../controllers/stock-movement.controller";

export const productRouter = Router();

productRouter.post("/", productController.create);
productRouter.get("/", productController.list);
productRouter.get("/:id/movements", stockMovementController.listByProduct);
productRouter.get("/:id", productController.getById);
