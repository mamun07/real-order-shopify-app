-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "buttonText" TEXT NOT NULL DEFAULT 'Cash on Delivery',
    "buttonColor" TEXT NOT NULL DEFAULT '#F97316',
    "addressDataset" TEXT NOT NULL DEFAULT 'bd',
    "flatRateLabel" TEXT NOT NULL DEFAULT 'Standard Delivery',
    "flatRateAmount" REAL NOT NULL DEFAULT 0,
    "freeShipLabel" TEXT NOT NULL DEFAULT 'Free Shipping',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CodOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderName" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "province" TEXT,
    "city" TEXT,
    "address" TEXT NOT NULL,
    "zip" TEXT,
    "shippingMethod" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");

-- CreateIndex
CREATE INDEX "CodOrder_shop_idx" ON "CodOrder"("shop");

-- CreateIndex
CREATE INDEX "CodOrder_shop_orderId_idx" ON "CodOrder"("shop", "orderId");
