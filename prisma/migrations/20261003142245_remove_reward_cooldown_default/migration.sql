-- The User_*_trgm_idx indexes are hand-written raw SQL (pg_trgm GIN indexes,
-- no schema.prisma representation) — never drop them here.

-- AlterTable
ALTER TABLE "LoyaltyConfig" ALTER COLUMN "rewardCooldownDays" DROP DEFAULT;

-- El dueño pidió sacar el límite de "un canje cada 30 días" por beneficio
-- (lo veía como "límite mensual" en /canjear) y dejar solo el vencimiento
-- del código de canje (ya es 3 días = 72hs) como único límite real.
UPDATE "LoyaltyConfig" SET
  "rewardCooldownDays" = NULL,
  "redemptionCodeExpiryHours" = 72
WHERE "id" = 'singleton';
