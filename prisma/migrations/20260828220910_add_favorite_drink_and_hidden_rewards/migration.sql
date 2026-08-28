-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "favoriteDrink" TEXT;
