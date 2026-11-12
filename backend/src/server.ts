import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { productRouter } from "./routes/product.routes";
import { stockMovementRouter } from "./routes/stock-movement.routes";

dotenv.config();

export const app = express();
const port = Number(process.env.PORT) || 3333;

app.use(cors());
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

export const startServer = (): void => {
  app.listen(port, () => {
    console.log(`StockFlow API running on port ${port}`);
  });
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}
