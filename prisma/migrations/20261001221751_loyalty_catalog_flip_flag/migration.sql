-- The User_*_trgm_idx indexes are hand-written raw SQL (pg_trgm GIN indexes,
-- no schema.prisma representation) — never drop them here.

-- AlterTable
ALTER TABLE "LoyaltyConfig" ADD COLUMN     "catalogFlippedAt" TIMESTAMP(3);

-- Box sorpresa (reglas 2026) — nuevos desde el primer día, sin esperar el
-- fin del período de gracia. Bloqueados hasta cumplir minimumVisits (ver
-- reward-service.ts). Precios internos (internalListPrice/internalCostCap)
-- son solo de referencia para el admin, nunca se muestran al socio.
INSERT INTO "Reward" (
  "id", "name", "description", "icon", "category", "pointsCost",
  "minimumVisits", "maxProductPrice", "internalListPrice", "internalCostCap",
  "internalNotes", "active", "hidden", "createdAt", "updatedAt"
) VALUES (
  'seed-reward-box-chico', 'Box sorpresa chico',
  'Una caja sorpresa para compartir: tortas, cookies y alfajores elegidos por nosotros.',
  '🎁', 'PRODUCT', 2500,
  8, NULL, 48000, 13000,
  'Contenido: 2 porciones de torta + 2 cookies + 2 alfajores. Lo arma el local, el socio no elige.',
  true, false, now(), now()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Reward" (
  "id", "name", "description", "icon", "category", "pointsCost",
  "minimumVisits", "maxProductPrice", "internalListPrice", "internalCostCap",
  "internalNotes", "active", "hidden", "createdAt", "updatedAt"
) VALUES (
  'seed-reward-box-grande', 'Box sorpresa grande',
  'Una torta entera a tu elección y un par de antojos más. Avisanos con 48 horas.',
  '🎁', 'PRODUCT', 4000,
  8, 60000, 78000, 24000,
  'Contenido: 1 torta entera a elección (hasta $60.000 de lista) + 2 cookies. Pedir con 48hs de anticipación (torta por encargo).',
  true, false, now(), now()
) ON CONFLICT ("id") DO NOTHING;
