-- The User_*_trgm_idx indexes are hand-written raw SQL (pg_trgm GIN indexes,
-- no schema.prisma representation) — never drop them here.

-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "discountFixedAmount" DECIMAL(10,2),
ADD COLUMN     "discountPct" DECIMAL(5,2);
