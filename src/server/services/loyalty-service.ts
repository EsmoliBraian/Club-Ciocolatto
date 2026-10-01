import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import type { PointSource, PointTransaction, PointTransactionType, Prisma } from "@prisma/client";
import { listActiveTiers, getEffectiveTier } from "@/server/services/tier-service";
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

  // "Saldo protegido" (reglas 2026): nunca vence, pero si el saldo baja por
  // debajo de lo protegido (un canje, un ajuste negativo), se achica junto
  // con él — así cualquier vencimiento futuro siempre gasta primero los
  // puntos nuevos, nunca los protegidos.
  const newProtectedBalance = Math.min(profile.protectedBalance, newBalance);

  // El nivel ahora se basa en compras de los últimos 12 meses (o el nivel
  // congelado para socios existentes) — ver tier-service.ts. Solo una
  // compra puede moverlo, así que no vale la pena recalcularlo (ni pagar el
  // query extra) para ningún otro tipo de movimiento.
  const affectsTier = input.source === "PURCHASE" && (input.type === "EARN" || input.type === "REFUND");
  const tiers = affectsTier ? await listActiveTiers(db) : [];
  const previousTier = affectsTier ? await getEffectiveTier(profile, tiers, db) : null;

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

  // OJO: pasa `{ ...profile, lifetimePoints: newLifetime }`, no `profile` tal
  // cual — getEffectiveTier (cuando las reglas 2026 todavía no se activaron)
  // cae a resolveTierForPoints(profile.lifetimePoints, tiers), y profile acá
  // es el fetch de ANTES de esta transacción. Pasar el mismo objeto stale a
  // las dos llamadas haría que previousTier y newTier salgan siempre iguales
  // — nunca se detectaría un cambio de nivel.
  const newTier = affectsTier
    ? await getEffectiveTier({ ...profile, lifetimePoints: newLifetime }, tiers, db)
    : null;
  const tierChanged = affectsTier && (previousTier?.tier?.id ?? null) !== (newTier?.tier?.id ?? null);

  await db.customerProfile.update({
    where: { id: input.customerProfileId },
    data: {
      pointsBalance: newBalance,
      lifetimePoints: newLifetime,
      protectedBalance: newProtectedBalance,
      ...(affectsTier ? { tierId: newTier?.tier?.id ?? null } : {}),
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

  if (tierChanged && newTier?.tier) {
    await notify(
      {
        userId: profile.userId,
        type: "TIER_UPGRADED",
        title: `¡Felicitaciones! Ahora sos ${newTier.tier.name}`,
        body: "Desbloqueaste nuevos beneficios.",
      },
      db
    );
  }

  return {
    transaction,
    balanceAfter: newBalance,
    tierChanged,
    previousTierId: previousTier?.tier?.id ?? null,
    newTierId: newTier?.tier?.id ?? null,
  };
}

/** Rebuilds a customer's cached balance/lifetime points from the ledger — for audits or repairs.
 * Does NOT touch tierId/protectedBalance/legacyTierId — those aren't pure functions of the
 * ledger sum since reglas 2026 (tier depends on a rolling window + the legacy freeze; protected
 * balance is a floor set once at activation, not reconstructable from transactions alone). */
export async function reconcileCustomerBalance(customerProfileId: string, db: Db = prisma) {
  const transactions = await db.pointTransaction.findMany({
    where: { customerProfileId },
    orderBy: { createdAt: "asc" },
  });

  const pointsBalance = transactions.reduce((sum, t) => sum + t.amount, 0);
  const lifetimePoints = transactions
    .filter((t) => LIFETIME_COUNTING_TYPES.includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  return db.customerProfile.update({
    where: { id: customerProfileId },
    data: {
      pointsBalance: Math.max(0, pointsBalance),
      lifetimePoints: Math.max(0, lifetimePoints),
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
