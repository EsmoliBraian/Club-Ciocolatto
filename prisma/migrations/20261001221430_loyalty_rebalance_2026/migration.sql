-- AlterEnum
ALTER TYPE "PointSource" ADD VALUE 'TIER_BONUS';

-- The User_*_trgm_idx indexes are hand-written raw SQL (pg_trgm GIN indexes,
-- no schema.prisma representation) — never drop them here.

-- AlterTable
ALTER TABLE "CustomerProfile" ADD COLUMN     "legacyTierId" TEXT,
ADD COLUMN     "protectedBalance" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LoyaltyConfig" ADD COLUMN     "activationDate" TIMESTAMP(3),
ADD COLUMN     "anniversaryMinVisits" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "boxUnlockVisits" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "gracePeriodDays" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "referralMinPurchaseAmount" DECIMAL(10,2) NOT NULL DEFAULT 10000,
ADD COLUMN     "visitMinimumAmount" DECIMAL(10,2) NOT NULL DEFAULT 8000,
ADD COLUMN     "winbackDiscountCap" DECIMAL(10,2) NOT NULL DEFAULT 3000,
ADD COLUMN     "winbackMaxFrequencyDays" INTEGER NOT NULL DEFAULT 90,
ADD COLUMN     "winbackValidDays" INTEGER NOT NULL DEFAULT 15;

-- AlterTable
ALTER TABLE "LoyaltyTier" ADD COLUMN     "earnMultiplier" DECIMAL(4,2) NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "discountCapAmount" DECIMAL(10,2),
ADD COLUMN     "internalCostCap" DECIMAL(10,2),
ADD COLUMN     "internalListPrice" DECIMAL(10,2),
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "maxProductPrice" DECIMAL(10,2),
ADD COLUMN     "minimumPurchaseAmount" DECIMAL(10,2),
ADD COLUMN     "minimumVisits" INTEGER;

-- AlterTable
ALTER TABLE "RewardRedemption" ADD COLUMN     "saleAmount" DECIMAL(10,2);

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_legacyTierId_fkey" FOREIGN KEY ("legacyTierId") REFERENCES "LoyaltyTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
