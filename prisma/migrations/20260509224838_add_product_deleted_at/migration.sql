-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Product_sellerId_deletedAt_idx" ON "Product"("sellerId", "deletedAt");
