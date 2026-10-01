-- The User_*_trgm_idx indexes are hand-written raw SQL (pg_trgm GIN indexes,
-- no schema.prisma representation) — never drop them here.

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "icon" TEXT;
