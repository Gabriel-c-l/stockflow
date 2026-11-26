ALTER TABLE "StockMovement"
ADD COLUMN "unitCost" DECIMAL(12, 2);

ALTER TABLE "StockMovement"
ADD CONSTRAINT "StockMovement_unitCost_nonnegative_check"
CHECK ("unitCost" IS NULL OR "unitCost" >= 0);
