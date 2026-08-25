-- Remove unused ShopSettings fields: shipping is now always the merchant's
-- real Shopify shipping rates, and the province/city dataset is controlled
-- entirely by the theme block setting, not stored server-side.
ALTER TABLE "ShopSettings" DROP COLUMN "addressDataset";
ALTER TABLE "ShopSettings" DROP COLUMN "flatRateLabel";
ALTER TABLE "ShopSettings" DROP COLUMN "flatRateAmount";
ALTER TABLE "ShopSettings" DROP COLUMN "freeShipLabel";
