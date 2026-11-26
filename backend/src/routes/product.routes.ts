import { authorize } from "../middlewares/authorize";
import { Router } from "express";
import * as productController from "../controllers/product.controller";
import * as stockMovementController from "../controllers/stock-movement.controller";

export const productRouter = Router();
productRouter.post("/", authorize("ADMIN", "MANAGER"), productController.create);
productRouter.get("/", productController.list);
productRouter.get("/:id/movements", stockMovementController.listByProduct);
productRouter.get("/:id", productController.getById);
productRouter.patch("/:id", authorize("ADMIN", "MANAGER"), productController.update);
productRouter.delete("/:id", authorize("ADMIN", "MANAGER"), productController.deactivate);
