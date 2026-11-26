import { Router } from "express";
import * as controller from "../controllers/user.controller";
import { authorize } from "../middlewares/authorize";

export const userRouter = Router();
userRouter.use(authorize("ADMIN"));
userRouter.get("/", controller.list);
userRouter.post("/", controller.create);
userRouter.patch("/:id", controller.update);
userRouter.delete("/:id", controller.deactivate);
