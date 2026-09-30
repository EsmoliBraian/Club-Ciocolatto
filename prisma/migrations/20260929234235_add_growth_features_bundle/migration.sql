-- CreateEnum
CREATE TYPE "PointClaimType" AS ENUM ('SOCIAL_MEDIA_POST', 'REVIEW', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PointClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ANNIVERSARY';
ALTER TYPE "NotificationType" ADD VALUE 'WINBACK';
ALTER TYPE "NotificationType" ADD VALUE 'POINTS_EXPIRING';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PointSource" ADD VALUE 'ANNIVERSARY';
ALTER TYPE "PointSource" ADD VALUE 'VISIT_STREAK';
ALTER TYPE "PointSource" ADD VALUE 'PROFILE_COMPLETION';
ALTER TYPE "PointSource" ADD VALUE 'SURVEY_RESPONSE';
ALTER TYPE "PointSource" ADD VALUE 'CLAIM_APPROVED';
ALTER TYPE "PointSource" ADD VALUE 'REFERRAL_DUO';

-- NOTE: Prisma's diff engine wanted to DROP the 4 pg_trgm GIN indexes here
-- (User_email_trgm_idx, User_firstName_trgm_idx, User_lastName_trgm_idx,
-- User_phone_trgm_idx) because they were added via hand-written raw SQL in
-- an earlier migration and have no schema.prisma representation for Prisma
-- to diff against. Intentionally removed from this migration — they must
-- stay, they back the admin customer-search feature.

-- AlterTable
ALTER TABLE "CustomerProfile" ADD COLUMN     "anniversaryRewardClaimedYear" INTEGER,
ADD COLUMN     "lastPointsExpiryWarningAt" TIMESTAMP(3),
ADD COLUMN     "lastWinbackSentAt" TIMESTAMP(3),
ADD COLUMN     "profileCompletionAwardedAt" TIMESTAMP(3),
ADD COLUMN     "visitStreakMilestoneWeeks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "visitStreakWeekStart" DATE,
ADD COLUMN     "visitStreakWeeks" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LoyaltyConfig" ADD COLUMN     "anniversaryPoints" INTEGER NOT NULL DEFAULT 150,
ADD COLUMN     "profileCompletionPoints" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "referralDuoBonusPoints" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "referralDuoMilestoneTierId" TEXT,
ADD COLUMN     "rewardCooldownDays" INTEGER DEFAULT 30,
ADD COLUMN     "surveyPoints" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "surveyQuestion" TEXT,
ADD COLUMN     "winbackInactivityDays" INTEGER NOT NULL DEFAULT 35,
ADD COLUMN     "winbackMinimumTierId" TEXT;

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "endMinute" INTEGER,
ADD COLUMN     "startMinute" INTEGER;

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "duoBonusPaidAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PointClaim" (
    "id" TEXT NOT NULL,
    "customerProfileId" TEXT NOT NULL,
    "type" "PointClaimType" NOT NULL,
    "description" TEXT,
    "proofUrl" TEXT,
    "pointsRequested" INTEGER NOT NULL,
    "pointsAwarded" INTEGER,
    "status" "PointClaimStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "PointClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "customerProfileId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PointClaim_status_createdAt_idx" ON "PointClaim"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PointClaim_customerProfileId_type_idx" ON "PointClaim"("customerProfileId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_customerProfileId_key" ON "SurveyResponse"("customerProfileId");

-- AddForeignKey
ALTER TABLE "LoyaltyConfig" ADD CONSTRAINT "LoyaltyConfig_winbackMinimumTierId_fkey" FOREIGN KEY ("winbackMinimumTierId") REFERENCES "LoyaltyTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyConfig" ADD CONSTRAINT "LoyaltyConfig_referralDuoMilestoneTierId_fkey" FOREIGN KEY ("referralDuoMilestoneTierId") REFERENCES "LoyaltyTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointClaim" ADD CONSTRAINT "PointClaim_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointClaim" ADD CONSTRAINT "PointClaim_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill the new milestone-tier FKs on the existing production config
-- singleton (prisma/seed.ts also does this for fresh databases, but a
-- reseed is not guaranteed to run against production after this deploy).
UPDATE "LoyaltyConfig"
SET "winbackMinimumTierId" = (SELECT id FROM "LoyaltyTier" WHERE slug = 'fanatico-ciocolatto' LIMIT 1)
WHERE id = 'singleton' AND "winbackMinimumTierId" IS NULL;

UPDATE "LoyaltyConfig"
SET "referralDuoMilestoneTierId" = (SELECT id FROM "LoyaltyTier" WHERE slug = 'fan-ciocolatto' LIMIT 1)
WHERE id = 'singleton' AND "referralDuoMilestoneTierId" IS NULL;

-- Reward catalog changes (owner-approved): Medialuna now grants 2 + costs
-- more; Porción de torta becomes a 15% OFF discount reward instead of a
-- free slice. Applied directly here so it ships atomically with this
-- migration regardless of whether db:seed is ever re-run in production.
UPDATE "Reward" SET description = '2 medialunas de manteca gratis.', "pointsCost" = 400
WHERE id = 'seed-reward-medialuna';

UPDATE "Reward" SET category = 'DISCOUNT', description = '15% OFF en tu porción de torta'
WHERE id = 'seed-reward-torta';
