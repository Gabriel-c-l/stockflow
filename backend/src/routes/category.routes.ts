import { authorize } from "../middlewares/authorize";
import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
export const categoryRouter = Router();
categoryRouter.post("/", authorize("ADMIN", "MANAGER"), categoryController.create);
categoryRouter.get("/", categoryController.list);
categoryRouter.get("/:id", categoryController.getById);
categoryRouter.patch("/:id", authorize("ADMIN", "MANAGER"), categoryController.update);
categoryRouter.delete("/:id", authorize("ADMIN", "MANAGER"), categoryController.deactivate);
