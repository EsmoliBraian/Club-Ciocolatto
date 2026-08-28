import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import type { LoyaltyTier } from "@prisma/client";

export async function listActiveTiers(db: Db = prisma): Promise<LoyaltyTier[]> {
  return db.loyaltyTier.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" },
  });
}

/** Request-deduplicated variant for use in Server Components. */
export const listActiveTiersCached = cache(() => listActiveTiers(prisma));

/** The tier a customer with `lifetimePoints` belongs to, given the active tier ladder. */
export function resolveTierForPoints(
  lifetimePoints: number,
  tiers: LoyaltyTier[]
): LoyaltyTier | null {
  const sorted = [...tiers].sort((a, b) => a.minimumPoints - b.minimumPoints);
  let match: LoyaltyTier | null = null;
  for (const tier of sorted) {
    if (lifetimePoints >= tier.minimumPoints) {
      match = tier;
    }
  }
  return match;
}

export function resolveNextTier(
  currentTier: LoyaltyTier | null,
  tiers: LoyaltyTier[]
): LoyaltyTier | null {
  const sorted = [...tiers].sort((a, b) => a.minimumPoints - b.minimumPoints);
  if (!currentTier) return sorted[0] ?? null;
  const idx = sorted.findIndex((t) => t.id === currentTier.id);
  return sorted[idx + 1] ?? null;
}

export interface TierProgress {
  currentTier: LoyaltyTier | null;
  nextTier: LoyaltyTier | null;
  pointsIntoTier: number;
  pointsToNextTier: number | null;
  progressPct: number; // 0-100, 100 if at the top tier
}

export function calculateTierProgress(
  lifetimePoints: number,
  tiers: LoyaltyTier[]
): TierProgress {
  const currentTier = resolveTierForPoints(lifetimePoints, tiers);
  const nextTier = resolveNextTier(currentTier, tiers);

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      pointsIntoTier: lifetimePoints - (currentTier?.minimumPoints ?? 0),
      pointsToNextTier: null,
      progressPct: 100,
    };
  }

  const floor = currentTier?.minimumPoints ?? 0;
  const span = nextTier.minimumPoints - floor;
  const pointsIntoTier = lifetimePoints - floor;
  const progressPct = span > 0 ? Math.min(100, Math.max(0, (pointsIntoTier / span) * 100)) : 0;

  return {
    currentTier,
    nextTier,
    pointsIntoTier,
    pointsToNextTier: Math.max(0, nextTier.minimumPoints - lifetimePoints),
    progressPct,
  };
}
