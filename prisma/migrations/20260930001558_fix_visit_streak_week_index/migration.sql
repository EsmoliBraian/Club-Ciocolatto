/*
  Warnings:

  - You are about to drop the column `visitStreakWeekStart` on the `CustomerProfile` table. All the data in the column will be lost.

*/
-- NOTE: intentionally not dropping the 4 pg_trgm GIN indexes Prisma's diff
-- wanted to remove here — same reason as the previous migration: they're
-- hand-written raw SQL with no schema.prisma representation, and they back
-- the admin customer-search feature.

-- AlterTable
ALTER TABLE "CustomerProfile" DROP COLUMN "visitStreakWeekStart",
ADD COLUMN     "visitStreakWeekIndex" INTEGER;
