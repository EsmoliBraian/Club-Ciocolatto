import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import type { PointSource, PointTransaction, PointTransactionType, Prisma } from "@prisma/client";
import { listActiveTiers, resolveTierForPoints } from "@/server/services/tier-service";
import { notify } from "@/server/services/notification-service";

export interface AwardPointsInput {
  customerProfileId: string;
  type: PointTransactionType;
  source: PointSource;
  amount: number; // signed: positive for EARN/BONUS/REFUND, negative for REDEEM/EXPIRATION/negative ADJUSTMENT
  description: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Prisma.InputJsonValue;
  createdById?: string;
  /** Skip the in-app "you earned points" notification (used for silent corrections). */
  silent?: boolean;
}

export interface AwardPointsResult {
  transaction: PointTransaction;
  balanceAfter: number;
  tierChanged: boolean;
  previousTierId: string | null;
  newTierId: string | null;
}

const LIFETIME_COUNTING_TYPES: PointTransactionType[] = ["EARN", "BONUS", "REFUND", "ADJUSTMENT"];

/**
 * The single entry point for every points change in the system. Never mutate
 * CustomerProfile.pointsBalance directly — always go through here so the
 * ledger (PointTransaction) and the cached balance can never drift apart.
 *
 * Must be called with a transaction client when part of a larger flow (order
 * registration, mission completion, redemption) so the ledger write and the
 * balance/tier update commit atomically.
 */
export async function awardPoints(
  input: AwardPointsInput,
  db: Db = prisma
): Promise<AwardPointsResult> {
  const profile = await db.customerProfile.findUniqueOrThrow({
    where: { id: input.customerProfileId },
  });

  const newBalance = profile.pointsBalance + input.amount;
  if (newBalance < 0) {
    throw new Error("INSUFFICIENT_POINTS");
  }

  const countsTowardLifetime = LIFETIME_COUNTING_TYPES.includes(input.type);
  const newLifetime = countsTowardLifetime
    ? Math.max(0, profile.lifetimePoints + input.amount)
    : profile.lifetimePoints;

  const tiers = await listActiveTiers(db);
  const previousTier = resolveTierForPoints(profile.lifetimePoints, tiers);
  const newTier = resolveTierForPoints(newLifetime, tiers);
  const tierChanged = (previousTier?.id ?? null) !== (newTier?.id ?? null);

  const transaction = await db.pointTransaction.create({
    data: {
      customerProfileId: input.customerProfileId,
      type: input.type,
      source: input.source,
      amount: input.amount,
      balanceAfter: newBalance,
      description: input.description,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      metadata: input.metadata,
      createdById: input.createdById,
    },
  });

  await db.customerProfile.update({
    where: { id: input.customerProfileId },
    data: {
      pointsBalance: newBalance,
      lifetimePoints: newLifetime,
      tierId: newTier?.id ?? null,
    },
  });

  if (!input.silent && input.amount > 0) {
    await notify(
      {
        userId: profile.userId,
        type: "POINTS_EARNED",
        title: `+${input.amount} puntos`,
        body: input.description,
      },
      db
    );
  } else if (!input.silent && input.amount < 0 && input.type === "REDEEM") {
    await notify(
      {
        userId: profile.userId,
        type: "POINTS_REDEEMED",
        title: `-${Math.abs(input.amount)} puntos`,
        body: input.description,
      },
      db
    );
  }

  if (tierChanged && newTier) {
    await notify(
      {
        userId: profile.userId,
        type: "TIER_UPGRADED",
        title: `¡Felicitaciones! Ahora sos ${newTier.name}`,
        body: "Desbloqueaste nuevos beneficios.",
      },
      db
    );
  }

  return {
    transaction,
    balanceAfter: newBalance,
    tierChanged,
    previousTierId: previousTier?.id ?? null,
    newTierId: newTier?.id ?? null,
  };
}

/** Rebuilds a customer's cached balance/lifetime points from the ledger — for audits or repairs. */
export async function reconcileCustomerBalance(customerProfileId: string, db: Db = prisma) {
  const transactions = await db.pointTransaction.findMany({
    where: { customerProfileId },
    orderBy: { createdAt: "asc" },
  });

  const pointsBalance = transactions.reduce((sum, t) => sum + t.amount, 0);
  const lifetimePoints = transactions
    .filter((t) => LIFETIME_COUNTING_TYPES.includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const tiers = await listActiveTiers(db);
  const tier = resolveTierForPoints(Math.max(0, lifetimePoints), tiers);

  return db.customerProfile.update({
    where: { id: customerProfileId },
    data: {
      pointsBalance: Math.max(0, pointsBalance),
      lifetimePoints: Math.max(0, lifetimePoints),
      tierId: tier?.id ?? null,
    },
  });
}

export async function getPointsHistory(
  customerProfileId: string,
  db: Db = prisma,
  take = 50
) {
  return db.pointTransaction.findMany({
    where: { customerProfileId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
