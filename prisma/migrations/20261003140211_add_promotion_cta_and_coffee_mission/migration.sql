-- The User_*_trgm_idx indexes are hand-written raw SQL (pg_trgm GIN indexes,
-- no schema.prisma representation) — never drop them here.

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "ctaUrl" TEXT;

-- "Misión Café" pasa de pagar puntos a otorgar directamente el premio
-- "Café gratis a elección" (6 cafés en vez de 5) — ver mission-service.ts
-- (claimMissionReward ahora lee Mission.rewardId y llama grantFreeReward).
INSERT INTO "Reward" (
  "id", "name", "description", "icon", "category", "pointsCost",
  "active", "hidden", "createdAt", "updatedAt"
) VALUES (
  'seed-reward-cafe-eleccion', 'Café gratis a elección',
  'Tu café favorito gratis, por tu fidelidad.',
  '☕', 'PRODUCT', 0,
  true, true, now(), now()
) ON CONFLICT ("id") DO NOTHING;

UPDATE "Mission" SET
  "description" = 'Comprá 6 cafés y el próximo es gratis, a tu elección.',
  "targetValue" = 6,
  "rewardPoints" = 0,
  "rewardId" = 'seed-reward-cafe-eleccion',
  "updatedAt" = now()
WHERE "id" = 'seed-mission-cafe';

-- Día de la Madre — 100% informativa/externa (el canje se coordina por
-- WhatsApp vía ctaUrl, sin puntos/descuento automático). endAt más cercano
-- que el de "Puntos dobles miércoles y jueves" la pone en primer plano en
-- /inicio y /promociones (ambos ordenan por endAt asc), dejando esa otra
-- promo en segundo plano sin tocar su configuración.
INSERT INTO "Promotion" (
  "id", "name", "description", "icon", "type",
  "startAt", "endAt", "ctaUrl", "active", "createdAt", "updatedAt"
) VALUES (
  'seed-promo-dia-de-la-madre', 'Día de la Madre',
  'Encargando la caja para el día de la madre, te damos un cupón de 1 café gratis.',
  '☕', 'BONUS_POINTS',
  now(), '2026-10-19T02:59:59Z',
  'https://wa.me/5492914636722?text=Vengo%20de%20Club%20Ciocolatto%2C%20me%20interesa%20encargar%20el%20box%20para%20el%20d%C3%ADa%20de%20la%20madre',
  true, now(), now()
) ON CONFLICT ("id") DO NOTHING;
