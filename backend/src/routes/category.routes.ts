import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
export const categoryRouter = Router();
categoryRouter.post("/", categoryController.create);
categoryRouter.get("/", categoryController.list);
categoryRouter.get("/:id", categoryController.getById);
categoryRouter.patch("/:id", categoryController.update);
categoryRouter.delete("/:id", categoryController.deactivate);
