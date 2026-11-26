import { authorize } from "../middlewares/authorize";
import { Router } from "express";
import * as supplierController from "../controllers/supplier.controller";

export const supplierRouter = Router();
supplierRouter.post("/", authorize("ADMIN", "MANAGER"), supplierController.create);
supplierRouter.get("/", supplierController.list);
supplierRouter.get("/:id", supplierController.getById);
supplierRouter.patch("/:id", authorize("ADMIN", "MANAGER"), supplierController.update);
supplierRouter.delete("/:id", authorize("ADMIN", "MANAGER"), supplierController.deactivate);
