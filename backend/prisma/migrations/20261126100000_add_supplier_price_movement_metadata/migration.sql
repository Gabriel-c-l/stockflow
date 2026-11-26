-- Extend StockFlow's existing relational model without deleting or rewriting existing records.
-- Existing products receive price = 0; existing stock movements keep supplier/recipient as NULL.

CREATE TABLE "Supplier" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Supplier_taxId_key" ON "Supplier"("taxId");
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");
CREATE INDEX "Supplier_isActive_name_idx" ON "Supplier"("isActive", "name");

ALTER TABLE "Product"
    ADD COLUMN "price" DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE "StockMovement"
    ADD COLUMN "supplierId" UUID,
    ADD COLUMN "recipient" TEXT;

CREATE INDEX "Product_isActive_name_idx" ON "Product"("isActive", "name");
CREATE INDEX "StockMovement_supplierId_idx" ON "StockMovement"("supplierId");
CREATE INDEX "StockMovement_type_createdAt_idx" ON "StockMovement"("type", "createdAt");

ALTER TABLE "StockMovement"
    ADD CONSTRAINT "StockMovement_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Product"
    ADD CONSTRAINT "Product_price_nonnegative_check" CHECK ("price" >= 0);

ALTER TABLE "StockMovement"
    ADD CONSTRAINT "StockMovement_quantity_positive_check" CHECK ("quantity" > 0);
