import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import type { CustomerProfile, LoyaltyTier } from "@prisma/client";
import { TIER_FREEZE_END, TIER_WINDOW_DAYS } from "@/lib/constants";

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

/** Sum of PURCHASE-sourced EARN points in the last `TIER_WINDOW_DAYS` days — the tier basis
 * since the reglas 2026 rebalance. Deliberately excludes PROMOTION/TIER_BONUS (the Wed/Thu
 * double-points and tier-multiplier extras) since those are recorded under a different
 * `source` — "cuenta el punto base, no el extra del multiplicador". */
export async function getRollingPurchasePoints(customerProfileId: string, db: Db = prisma): Promise<number> {
  const since = new Date(Date.now() - TIER_WINDOW_DAYS * 86_400_000);
  // EARN (positive) and REFUND (negative, same source) both included so a
  // refunded purchase nets back out of the window instead of staying
  // counted forever.
  const result = await db.pointTransaction.aggregate({
    where: { customerProfileId, source: "PURCHASE", type: { in: ["EARN", "REFUND"] }, createdAt: { gte: since } },
    _sum: { amount: true },
  });
  return Math.max(0, result._sum.amount ?? 0);
}

export interface EffectiveTierResult {
  tier: LoyaltyTier | null;
  /** True while this customer's tier is still the pre-2026 snapshot (legacyTierId), not yet
   * recalculated from rolling purchases — see TIER_FREEZE_END. */
  frozen: boolean;
  rollingPoints: number;
  progress: TierProgress;
}

/**
 * The tier that actually governs a customer's benefits right now.
 * - Existing customers (`legacyTierId` set at activation) keep that frozen tier until
 *   TIER_FREEZE_END, regardless of what their rolling purchases say.
 * - Everyone else (new customers from day one, or anyone once the freeze ends): the tier
 *   from `getRollingPurchasePoints` — this can go DOWN as old purchases fall out of the window.
 */
export async function getEffectiveTier(
  profile: Pick<CustomerProfile, "id" | "legacyTierId">,
  tiers: LoyaltyTier[],
  db: Db = prisma
): Promise<EffectiveTierResult> {
  if (profile.legacyTierId && Date.now() < TIER_FREEZE_END.getTime()) {
    const tier = tiers.find((t) => t.id === profile.legacyTierId) ?? null;
    return { tier, frozen: true, rollingPoints: 0, progress: calculateTierProgress(tier?.minimumPoints ?? 0, tiers) };
  }
  const rollingPoints = await getRollingPurchasePoints(profile.id, db);
  return {
    tier: resolveTierForPoints(rollingPoints, tiers),
    frozen: false,
    rollingPoints,
    progress: calculateTierProgress(rollingPoints, tiers),
  };
}
