-- Add categories and product metadata without changing existing stock balances.
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

ALTER TABLE "Product"
    ADD COLUMN "categoryId" UUID,
    ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'UN',
    ADD COLUMN "location" TEXT;

CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

ALTER TABLE "Product"
    ADD CONSTRAINT "Product_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
