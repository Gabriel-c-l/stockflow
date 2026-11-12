import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { productRouter } from "./routes/product.routes";
import { stockMovementRouter } from "./routes/stock-movement.routes";

dotenv.config();

const port = Number(process.env.PORT) || 3333;

const getAllowedOrigins = (): string[] =>
  (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

export const createApp = (
  allowedOrigins: string[] = getAllowedOrigins(),
): express.Express => {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin is not allowed by CORS."));
      },
    }),
  );
  app.use(express.json());
  app.use("/products", productRouter);
  app.use("/stock-movements", stockMovementRouter);

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
