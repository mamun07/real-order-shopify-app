-- Advance percent default 20 -> 25 (existing rows still on the old default)
UPDATE "ShopSettings" SET "partialValue" = 25 WHERE "partialValue" = 20;

-- bKash payment method
ALTER TABLE "ShopSettings" ADD COLUMN "bkashEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ShopSettings" ADD COLUMN "bkashMerchantNumber" TEXT NOT NULL DEFAULT '';

-- CodOrder: online-payment details
ALTER TABLE "CodOrder" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "CodOrder" ADD COLUMN "paymentChoice" TEXT;
ALTER TABLE "CodOrder" ADD COLUMN "bkashTrxId" TEXT;
ALTER TABLE "CodOrder" ADD COLUMN "paymentStatus" TEXT;
