-- Province lists are now scoped by country. Existing rows are the merchant's
-- Bangladesh district list.
ALTER TABLE "Province" ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'BD';

-- CreateIndex
CREATE INDEX "Province_shop_countryCode_idx" ON "Province"("shop", "countryCode");
