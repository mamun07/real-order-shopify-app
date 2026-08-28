-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "headerTitle" TEXT NOT NULL DEFAULT 'Cash on Delivery',
    "buttonText" TEXT NOT NULL DEFAULT 'Cash on Delivery',
    "buttonColor" TEXT NOT NULL DEFAULT '#F97316',
    "buttonTextColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "submitButtonText" TEXT NOT NULL DEFAULT 'COMPLETE ORDER',
    "fullNameLabel" TEXT NOT NULL DEFAULT 'Enter Your Full Name',
    "phoneLabel" TEXT NOT NULL DEFAULT 'Phone Number',
    "emailLabel" TEXT NOT NULL DEFAULT 'Email (optional)',
    "addressLabel" TEXT NOT NULL DEFAULT 'Full Address',
    "formWidth" INTEGER NOT NULL DEFAULT 480,
    "formMaxHeight" INTEGER NOT NULL DEFAULT 90,
    "otpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "otpSmsApiUrl" TEXT NOT NULL DEFAULT '',
    "otpSmsMethod" TEXT NOT NULL DEFAULT 'POST',
    "otpSmsApiKey" TEXT NOT NULL DEFAULT '',
    "otpSmsSenderId" TEXT NOT NULL DEFAULT '',
    "otpSmsParamsTemplate" TEXT NOT NULL DEFAULT '',
    "otpMessageTemplate" TEXT NOT NULL DEFAULT 'Your verification code is {code}',
    "partialEnabled" BOOLEAN NOT NULL DEFAULT false,
    "partialType" TEXT NOT NULL DEFAULT 'percent',
    "partialValue" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "partialNote" TEXT NOT NULL DEFAULT '',
    "bkashEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bkashMerchantNumber" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Province" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'BD',
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodOrder" (
    "id" TEXT NOT NULL,
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
    "total" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "advanceAmount" DOUBLE PRECISION,
    "codBalance" DOUBLE PRECISION,
    "paymentMethod" TEXT,
    "paymentChoice" TEXT,
    "bkashTrxId" TEXT,
    "paymentStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");

-- CreateIndex
CREATE INDEX "OtpChallenge_shop_phone_idx" ON "OtpChallenge"("shop", "phone");

-- CreateIndex
CREATE INDEX "Province_shop_idx" ON "Province"("shop");

-- CreateIndex
CREATE INDEX "Province_shop_countryCode_idx" ON "Province"("shop", "countryCode");

-- CreateIndex
CREATE INDEX "City_provinceId_idx" ON "City"("provinceId");

-- CreateIndex
CREATE INDEX "CodOrder_shop_idx" ON "CodOrder"("shop");

-- CreateIndex
CREATE INDEX "CodOrder_shop_orderId_idx" ON "CodOrder"("shop", "orderId");

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;

