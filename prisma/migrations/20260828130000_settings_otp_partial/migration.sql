-- ShopSettings: appearance controls
ALTER TABLE "ShopSettings" ADD COLUMN "headerTitle" TEXT NOT NULL DEFAULT 'Cash on Delivery';
ALTER TABLE "ShopSettings" ADD COLUMN "buttonTextColor" TEXT NOT NULL DEFAULT '#FFFFFF';
ALTER TABLE "ShopSettings" ADD COLUMN "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF';
ALTER TABLE "ShopSettings" ADD COLUMN "submitButtonText" TEXT NOT NULL DEFAULT 'COMPLETE ORDER';
ALTER TABLE "ShopSettings" ADD COLUMN "fullNameLabel" TEXT NOT NULL DEFAULT 'Enter Your Full Name';
ALTER TABLE "ShopSettings" ADD COLUMN "phoneLabel" TEXT NOT NULL DEFAULT 'Phone Number';
ALTER TABLE "ShopSettings" ADD COLUMN "emailLabel" TEXT NOT NULL DEFAULT 'Email (optional)';
ALTER TABLE "ShopSettings" ADD COLUMN "addressLabel" TEXT NOT NULL DEFAULT 'Full Address';
ALTER TABLE "ShopSettings" ADD COLUMN "formWidth" INTEGER NOT NULL DEFAULT 480;
ALTER TABLE "ShopSettings" ADD COLUMN "formMaxHeight" INTEGER NOT NULL DEFAULT 640;

-- ShopSettings: OTP verification
ALTER TABLE "ShopSettings" ADD COLUMN "otpEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ShopSettings" ADD COLUMN "otpSmsApiUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ShopSettings" ADD COLUMN "otpSmsMethod" TEXT NOT NULL DEFAULT 'POST';
ALTER TABLE "ShopSettings" ADD COLUMN "otpSmsApiKey" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ShopSettings" ADD COLUMN "otpSmsSenderId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ShopSettings" ADD COLUMN "otpSmsParamsTemplate" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ShopSettings" ADD COLUMN "otpMessageTemplate" TEXT NOT NULL DEFAULT 'Your verification code is {code}';

-- ShopSettings: partial (advance) payment
ALTER TABLE "ShopSettings" ADD COLUMN "partialEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ShopSettings" ADD COLUMN "partialType" TEXT NOT NULL DEFAULT 'percent';
ALTER TABLE "ShopSettings" ADD COLUMN "partialValue" REAL NOT NULL DEFAULT 20;
ALTER TABLE "ShopSettings" ADD COLUMN "partialNote" TEXT NOT NULL DEFAULT '';

-- CodOrder: partial-payment breakdown
ALTER TABLE "CodOrder" ADD COLUMN "advanceAmount" REAL;
ALTER TABLE "CodOrder" ADD COLUMN "codBalance" REAL;

-- CreateTable
CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "OtpChallenge_shop_phone_idx" ON "OtpChallenge"("shop", "phone");
