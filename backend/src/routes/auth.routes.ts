import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  updateLanguagePreferenceController,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate";
import { loginRateLimit } from "../middlewares/login-rate-limit";

export const authRouter = Router();

authRouter.post("/login", loginRateLimit, loginController);
authRouter.post("/logout", authenticate, logoutController);
authRouter.get("/me", authenticate, meController);
authRouter.patch("/preferences", authenticate, updateLanguagePreferenceController);
