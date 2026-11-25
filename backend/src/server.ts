import cors from "cors";
import dotenv from "dotenv";
import express, { type RequestHandler } from "express";
import { productRouter } from "./routes/product.routes";
import { stockMovementRouter } from "./routes/stock-movement.routes";
import { authRouter } from "./routes/auth.routes";
import { categoryRouter } from "./routes/category.routes";
import { createCsrfProtection } from "./middlewares/csrf";
import { authenticate } from "./middlewares/authenticate";

dotenv.config();

const port = Number(process.env.PORT) || 3333;

const getAllowedOrigins = (): string[] =>
  (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

export const createApp = (
  allowedOrigins: string[] = getAllowedOrigins(),
  authenticationMiddleware: RequestHandler = authenticate,
  csrfMiddleware?: RequestHandler,
): express.Express => {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      credentials: allowedOrigins.length > 0,
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin is not allowed by CORS."));
      },
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  app.use(csrfMiddleware ?? createCsrfProtection(allowedOrigins));
  app.use("/auth", authRouter);
  app.use("/categories", authenticationMiddleware, categoryRouter);
  app.use("/products", authenticationMiddleware, productRouter);
  app.use("/stock-movements", authenticationMiddleware, stockMovementRouter);

  app.get("/health", (_request, response) => {
    response.status(200).json({
      status: "ok",
      service: "stockflow-api",
      timestamp: new Date().toISOString(),
    });
  });

  return app;
};

export const app = createApp();

export const startServer = (): void => {
  app.listen(port, () => {
    console.log(`StockFlow API running on port ${port}`);
  });
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}
