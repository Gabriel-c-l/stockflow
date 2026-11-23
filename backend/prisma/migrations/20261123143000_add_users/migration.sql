-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'OPERATOR');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AlterTable
ALTER TABLE "StockMovement"
ADD COLUMN "performedById" UUID;

-- CreateIndex
CREATE INDEX "StockMovement_performedById_idx"
ON "StockMovement"("performedById");

-- AddForeignKey
ALTER TABLE "StockMovement"
ADD CONSTRAINT "StockMovement_performedById_fkey"
FOREIGN KEY ("performedById") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
