import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";

/**
 * The loyalty program's single tunable configuration row. Self-healing via
 * upsert so the app never breaks if the seed hasn't been run yet — it just
 * falls back to the schema defaults.
 */
export async function getLoyaltyConfig(db: Db = prisma) {
  return db.loyaltyConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

/** Request-deduplicated variant for use in Server Components. */
export const getLoyaltyConfigCached = cache(() => getLoyaltyConfig(prisma));

/** Points earned for a given spend amount, per the configurable rate. */
export function calculatePointsForAmount(
  amount: number,
  config: { amountPerPoint: unknown; pointsPerAmount: unknown }
): number {
  const amountPerPoint = Number(config.amountPerPoint);
  const pointsPerAmount = Number(config.pointsPerAmount);
  if (amountPerPoint <= 0) return 0;
  return Math.floor((amount / amountPerPoint) * pointsPerAmount);
}
