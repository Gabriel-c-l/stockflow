import { Router } from "express";
import * as supplierController from "../controllers/supplier.controller";

export const supplierRouter = Router();
supplierRouter.post("/", supplierController.create);
supplierRouter.get("/", supplierController.list);
supplierRouter.get("/:id", supplierController.getById);
supplierRouter.patch("/:id", supplierController.update);
supplierRouter.delete("/:id", supplierController.deactivate);
