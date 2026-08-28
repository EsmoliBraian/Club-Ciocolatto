-- CreateEnum
CREATE TYPE "RewardCategory" AS ENUM ('PRODUCT', 'DISCOUNT');

-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "category" "RewardCategory" NOT NULL DEFAULT 'PRODUCT';
