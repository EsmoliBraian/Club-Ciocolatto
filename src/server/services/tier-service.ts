import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import type { CustomerProfile, LoyaltyTier } from "@prisma/client";
import { TIER_WINDOW_DAYS } from "@/lib/constants";
import { getLoyaltyConfig } from "@/server/services/config-service";

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
  rollingPoints: number;
  progress: TierProgress;
}

/**
 * The tier that actually governs a customer's benefits right now.
 * - Reglas 2026 not activated yet (`LoyaltyConfig.activationDate` still null): behaves exactly
 *   like before this rebalance — resolved from `lifetimePoints`, no multiplier logic engaged
 *   anywhere downstream. This is what keeps deploying this code a no-op for real customers
 *   until an admin deliberately sets the activation date — never flip this check off.
 * - Once activated: everyone (existing and new customers alike) resolves from
 *   `getRollingPurchasePoints` — no grandfather freeze. A customer's tier can go DOWN the
 *   moment old purchases fall out of the 12-month window. This is deliberate — the owner
 *   explicitly asked for levels to keep moving, not freeze at today's status.
 */
export async function getEffectiveTier(
  profile: Pick<CustomerProfile, "id" | "lifetimePoints">,
  tiers: LoyaltyTier[],
  db: Db = prisma
): Promise<EffectiveTierResult> {
  const config = await getLoyaltyConfig(db);
  if (!config.activationDate) {
    const tier = resolveTierForPoints(profile.lifetimePoints, tiers);
    return { tier, rollingPoints: 0, progress: calculateTierProgress(profile.lifetimePoints, tiers) };
  }

  const rollingPoints = await getRollingPurchasePoints(profile.id, db);
  return {
    tier: resolveTierForPoints(rollingPoints, tiers),
    rollingPoints,
    progress: calculateTierProgress(rollingPoints, tiers),
  };
}
