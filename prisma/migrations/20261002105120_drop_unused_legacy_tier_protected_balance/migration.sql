-- The User_*_trgm_idx indexes are hand-written raw SQL (pg_trgm GIN indexes,
-- no schema.prisma representation) — never drop them here.

-- Reglas 2026: no hay congelamiento de nivel (el owner lo pidió explícitamente)
-- ni snapshot de saldo protegido (se deriva del ledger en vez de una columna
-- — ver getProtectedBalance en loyalty-service.ts). Ambas columnas quedaron
-- sin uso real, nunca llegaron a poblarse para ningún socio de producción.
ALTER TABLE "CustomerProfile" DROP CONSTRAINT "CustomerProfile_legacyTierId_fkey";

DROP INDEX IF EXISTS "CustomerProfile_legacyTierId_idx";

ALTER TABLE "CustomerProfile" DROP COLUMN "legacyTierId";
ALTER TABLE "CustomerProfile" DROP COLUMN "protectedBalance";
