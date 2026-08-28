import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import type { Reward } from "@prisma/client";
import { generateRedemptionCode } from "@/lib/codes";
import { awardPoints } from "@/server/services/loyalty-service";
import { notify } from "@/server/services/notification-service";
import { getLoyaltyConfig } from "@/server/services/config-service";
import { resolveTierForPoints, listActiveTiers } from "@/server/services/tier-service";

export class RewardRedemptionError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function listActiveRewards(db: Db = prisma): Promise<Reward[]> {
  const now = new Date();
  const rewards = await db.reward.findMany({
    where: { active: true },
    orderBy: { pointsCost: "asc" },
    include: { requiredTier: true },
  });
  return rewards.filter(
    (r) => (!r.validFrom || r.validFrom <= now) && (!r.validUntil || r.validUntil >= now)
  );
}

export interface RewardEligibility {
  reward: Reward;
  eligible: boolean;
  reason?: "INSUFFICIENT_POINTS" | "OUT_OF_STOCK" | "TIER_REQUIRED" | "LIMIT_REACHED";
}

export async function listRewardsForCustomer(
  customerProfileId: string,
  db: Db = prisma
): Promise<RewardEligibility[]> {
  // Sequential, not Promise.all: `db` may be an interactive transaction client
  // bound to a single connection, where concurrent queries would race.
  const rewards = await listActiveRewards(db);
  const profile = await db.customerProfile.findUniqueOrThrow({ where: { id: customerProfileId } });
  const tiers = await listActiveTiers(db);

  const customerTier = resolveTierForPoints(profile.lifetimePoints, tiers);
  const customerTierRank = customerTier
    ? tiers.findIndex((t) => t.id === customerTier.id)
    : -1;

  const redemptionCounts = await db.rewardRedemption.groupBy({
    by: ["rewardId"],
    where: { customerProfileId, status: { not: "CANCELLED" } },
    _count: { _all: true },
  });
  const countByReward = new Map(redemptionCounts.map((r) => [r.rewardId, r._count._all]));

  return rewards.map((reward) => {
    if (reward.requiredTierId) {
      const requiredRank = tiers.findIndex((t) => t.id === reward.requiredTierId);
      if (requiredRank === -1 || customerTierRank < requiredRank) {
        return { reward, eligible: false, reason: "TIER_REQUIRED" as const };
      }
    }
    if (reward.stock !== null && reward.stock <= 0) {
      return { reward, eligible: false, reason: "OUT_OF_STOCK" as const };
    }
    if (
      reward.perUserLimit !== null &&
      (countByReward.get(reward.id) ?? 0) >= reward.perUserLimit
    ) {
      return { reward, eligible: false, reason: "LIMIT_REACHED" as const };
    }
    if (profile.pointsBalance < reward.pointsCost) {
      return { reward, eligible: false, reason: "INSUFFICIENT_POINTS" as const };
    }
    return { reward, eligible: true };
  });
}

export interface RedeemRewardResult {
  redemptionCode: string;
  expiresAt: Date | null;
  pointsRemaining: number;
}

/** Must run inside `prisma.$transaction` — call sites wrap this. */
export async function redeemReward(
  db: Db,
  params: { customerProfileId: string; rewardId: string }
): Promise<RedeemRewardResult> {
  // Sequential, not Promise.all: `db` here is always an interactive transaction
  // client bound to a single connection, where concurrent queries would race.
  const reward = await db.reward.findUniqueOrThrow({ where: { id: params.rewardId } });
  const profile = await db.customerProfile.findUniqueOrThrow({ where: { id: params.customerProfileId } });
  const config = await getLoyaltyConfig(db);

  if (!reward.active) throw new RewardRedemptionError("INACTIVE", "Este beneficio ya no está disponible.");
  const now = new Date();
  if (reward.validFrom && reward.validFrom > now)
    throw new RewardRedemptionError("NOT_YET_VALID", "Este beneficio todavía no está disponible.");
  if (reward.validUntil && reward.validUntil < now)
    throw new RewardRedemptionError("EXPIRED", "Este beneficio ya venció.");

  if (reward.requiredTierId) {
    const tiers = await listActiveTiers(db);
    const requiredRank = tiers.findIndex((t) => t.id === reward.requiredTierId);
    const customerTier = resolveTierForPoints(profile.lifetimePoints, tiers);
    const customerRank = customerTier ? tiers.findIndex((t) => t.id === customerTier.id) : -1;
    if (customerRank < requiredRank) {
      throw new RewardRedemptionError("TIER_REQUIRED", "Tu nivel no alcanza para este beneficio.");
    }
  }

  if (profile.pointsBalance < reward.pointsCost) {
    throw new RewardRedemptionError("INSUFFICIENT_POINTS", "No tenés suficientes puntos.");
  }

  if (reward.perUserLimit !== null) {
    const count = await db.rewardRedemption.count({
      where: {
        customerProfileId: params.customerProfileId,
        rewardId: reward.id,
        status: { not: "CANCELLED" },
      },
    });
    if (count >= reward.perUserLimit) {
      throw new RewardRedemptionError("LIMIT_REACHED", "Ya alcanzaste el límite de canjes para este beneficio.");
    }
  }

  // Atomic stock decrement — the WHERE guard prevents overselling under concurrent redemptions.
  if (reward.stock !== null) {
    const updated = await db.reward.updateMany({
      where: { id: reward.id, stock: { gt: 0 } },
      data: { stock: { decrement: 1 } },
    });
    if (updated.count === 0) {
      throw new RewardRedemptionError("OUT_OF_STOCK", "Este beneficio se agotó.");
    }
  }

  const { balanceAfter } = await awardPoints(
    {
      customerProfileId: params.customerProfileId,
      type: "REDEEM",
      source: "REDEMPTION",
      amount: -reward.pointsCost,
      description: reward.name,
      referenceType: "Reward",
      referenceId: reward.id,
      silent: true,
    },
    db
  );

  const expiresAt = new Date(
    now.getTime() + config.redemptionCodeExpiryHours * 60 * 60 * 1000
  );

  let redemptionCode = generateRedemptionCode();
  // Extremely unlikely collision given the 8-char unambiguous alphabet, but guard anyway.
  for (let attempts = 0; attempts < 5; attempts++) {
    const exists = await db.rewardRedemption.findUnique({ where: { redemptionCode } });
    if (!exists) break;
    redemptionCode = generateRedemptionCode();
  }

  await db.rewardRedemption.create({
    data: {
      customerProfileId: params.customerProfileId,
      rewardId: reward.id,
      pointsSpent: reward.pointsCost,
      redemptionCode,
      status: "PENDING",
      expiresAt,
    },
  });

  await notify(
    {
      userId: profile.userId,
      type: "POINTS_REDEEMED",
      title: "¡Beneficio obtenido! 🎉",
      body: `${reward.name} — mostrá el código en caja para retirarlo.`,
    },
    db
  );

  return { redemptionCode, expiresAt, pointsRemaining: balanceAfter };
}

export async function getRedemptionHistory(customerProfileId: string, db: Db = prisma, take = 50) {
  return db.rewardRedemption.findMany({
    where: { customerProfileId },
    orderBy: { createdAt: "desc" },
    take,
    include: { reward: true },
  });
}

/** Looked up by the employee scanner when validating a customer's redemption code at the register. */
export async function findRedemptionByCode(code: string, db: Db = prisma) {
  return db.rewardRedemption.findUnique({
    where: { redemptionCode: code.trim().toUpperCase() },
    include: { reward: true, customerProfile: { include: { user: true } } },
  });
}

/** Must run inside `prisma.$transaction` — call sites wrap this. */
export async function markRedemptionUsed(
  db: Db,
  params: { redemptionCode: string; employeeId: string }
) {
  const redemption = await db.rewardRedemption.findUnique({
    where: { redemptionCode: params.redemptionCode.trim().toUpperCase() },
  });
  if (!redemption) throw new RewardRedemptionError("NOT_FOUND", "Código no encontrado.");
  if (redemption.status === "USED")
    throw new RewardRedemptionError("ALREADY_USED", "Este código ya fue utilizado.");
  if (redemption.status === "CANCELLED")
    throw new RewardRedemptionError("CANCELLED", "Este canje fue cancelado.");
  if (redemption.status === "EXPIRED" || (redemption.expiresAt && redemption.expiresAt < new Date())) {
    await db.rewardRedemption.update({ where: { id: redemption.id }, data: { status: "EXPIRED" } });
    throw new RewardRedemptionError("EXPIRED", "Este código venció.");
  }

  return db.rewardRedemption.update({
    where: { id: redemption.id },
    data: { status: "USED", redeemedAt: new Date(), redeemedById: params.employeeId },
  });
}
