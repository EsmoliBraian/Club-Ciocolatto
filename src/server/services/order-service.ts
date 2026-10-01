import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import type { LoyaltyConfig, OrderSource } from "@prisma/client";
import { awardPoints } from "@/server/services/loyalty-service";
import { getLoyaltyConfig, calculatePointsForAmount } from "@/server/services/config-service";
import { evaluateMissionsForOrder } from "@/server/services/mission-service";
import { completeReferralOnFirstPurchase } from "@/server/services/referral-service";
import { recordAuditLog } from "@/server/services/audit-service";
import { updateVisitStreak } from "@/server/services/streak-service";
import { listActiveTiers, getEffectiveTier } from "@/server/services/tier-service";
import { notify } from "@/server/services/notification-service";
import { toBusinessLocalParts } from "@/lib/timezone";

export class OrderServiceError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export interface RegisterOrderItemInput {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface RegisterOrderInput {
  customerProfileId: string;
  employeeId?: string;
  source: OrderSource;
  /** Required when `items` is omitted (e.g. employee entering a flat register total).
   * Always the NET amount actually paid — after any discount/redemption applied at the
   * register (reglas 2026: "puntos sobre lo pagado", nunca sobre la parte descontada). */
  totalAmount?: number;
  paymentMethod?: string;
  /** POS ticket / order id. Enforces "the same sale never earns points twice". */
  externalReference?: string;
  notes?: string;
  items?: RegisterOrderItemInput[];
  /**
   * When true (default — matches the POS integration, where item prices are
   * real and sum to the receipt total), `items` drives both the order total
   * and points. When false, `totalAmount` alone drives the total and points
   * — `items` are recorded and fed to mission tracking only, for callers
   * (the employee/admin manual flow) that tag "what was in this sale" for
   * mission purposes without pricing each line themselves.
   */
  itemsAffectPoints?: boolean;
}

interface ResolvedItem {
  productId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  category: string | null;
  pointsMultiplier: number;
  bonusPoints: number;
}

/** Base points only — product-level multiplier/bonusPoints (unrelated to reglas 2026) still
 * apply here, but NOT the tier or promotion rate, which are layered on separately by the
 * caller so they can be recorded under their own PointSource (see registerOrder). */
function computeBasePoints(totalAmount: number, items: ResolvedItem[], config: LoyaltyConfig): number {
  if (items.length === 0) {
    return calculatePointsForAmount(totalAmount, config);
  }
  return items.reduce((sum, item) => {
    const base = calculatePointsForAmount(item.subtotal, config);
    return sum + Math.floor(base * item.pointsMultiplier) + item.bonusPoints * item.quantity;
  }, 0);
}

interface PromotionRate {
  /** The highest POINTS_MULTIPLIER among matching active promotions (1 = none active). */
  multiplier: number;
  /** Sum of all matching active BONUS_POINTS promotions — a flat add, independent of the multiplier. */
  flatBonus: number;
}

/** Resolves which promotions apply to this order, WITHOUT applying them yet — the caller
 * (registerOrder) still needs to compare the promo multiplier against the customer's tier
 * multiplier and apply only the greater of the two (reglas 2026: no se acumulan). */
async function resolvePromotionRate(db: Db, items: ResolvedItem[]): Promise<PromotionRate> {
  const now = new Date();
  const promotions = await db.promotion.findMany({
    where: { active: true, startAt: { lte: now }, endAt: { gte: now } },
  });

  const { dayOfWeek, minuteOfDay } = toBusinessLocalParts(now);

  let multiplier = 1;
  let flatBonus = 0;
  for (const promo of promotions) {
    const storeWide = !promo.category && !promo.productId;
    const applies =
      storeWide ||
      items.some(
        (i) =>
          (promo.category && i.category === promo.category) ||
          (promo.productId && i.productId === promo.productId)
      );
    if (!applies) continue;

    const appliesDay = promo.daysOfWeek.length === 0 || promo.daysOfWeek.includes(dayOfWeek);
    const inTimeWindow =
      promo.startMinute == null ||
      promo.endMinute == null ||
      (minuteOfDay >= promo.startMinute && minuteOfDay < promo.endMinute);
    if (!appliesDay || !inTimeWindow) continue;

    if (promo.type === "POINTS_MULTIPLIER" && promo.multiplier) {
      multiplier = Math.max(multiplier, Number(promo.multiplier));
    }
    if (promo.type === "BONUS_POINTS" && promo.bonusPoints) {
      flatBonus += promo.bonusPoints;
    }
  }

  return { multiplier, flatBonus };
}

export interface RegisterOrderResult {
  orderId: string;
  pointsEarned: number;
  alreadyProcessed: boolean;
}

/**
 * The purchase orchestrator (the "motor de reglas"): registers the sale,
 * awards points (base + the greater of the tier/promotion multiplier, both
 * recorded separately so the base alone counts toward the tier window + first-
 * purchase bonus), advances order-driven missions, and completes a pending
 * referral once a qualifying purchase happens — all in one transaction.
 *
 * Idempotent on `externalReference`: replaying the same POS ticket id returns
 * the original result instead of awarding points twice.
 */
export async function registerOrder(input: RegisterOrderInput): Promise<RegisterOrderResult> {
  if (input.externalReference) {
    const existing = await prisma.order.findUnique({ where: { externalReference: input.externalReference } });
    if (existing) {
      return { orderId: existing.id, pointsEarned: existing.pointsEarned, alreadyProcessed: true };
    }
  }
  if (!input.items?.length && input.totalAmount === undefined) {
    throw new OrderServiceError("MISSING_AMOUNT", "Falta el monto de la compra.");
  }

  const config = await getLoyaltyConfig();

  return prisma.$transaction(async (tx) => {
    if (input.externalReference) {
      const existing = await tx.order.findUnique({ where: { externalReference: input.externalReference } });
      if (existing) {
        return { orderId: existing.id, pointsEarned: existing.pointsEarned, alreadyProcessed: true };
      }
    }

    const profile = await tx.customerProfile.findUniqueOrThrow({
      where: { id: input.customerProfileId },
    });

    const itemsAffectPoints = input.itemsAffectPoints ?? true;
    let resolvedItems: ResolvedItem[] = [];
    let totalAmount = input.totalAmount ?? 0;

    if (input.items && input.items.length > 0) {
      const productIds = input.items.map((i) => i.productId).filter((id): id is string => !!id);
      const products = productIds.length
        ? await tx.product.findMany({ where: { id: { in: productIds } } })
        : [];

      resolvedItems = input.items.map((item) => {
        const product = item.productId ? products.find((p) => p.id === item.productId) : undefined;
        return {
          productId: item.productId ?? null,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.unitPrice * item.quantity,
          category: product?.category ?? null,
          pointsMultiplier: product ? Number(product.pointsMultiplier) : 1,
          bonusPoints: product?.bonusPoints ?? 0,
        };
      });
      if (itemsAffectPoints) {
        totalAmount = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);
      }
    }

    const basePoints = itemsAffectPoints
      ? computeBasePoints(totalAmount, resolvedItems, config)
      : computeBasePoints(totalAmount, [], config);

    const promoRate = await resolvePromotionRate(tx, resolvedItems);
    const tiers = await listActiveTiers(tx);
    const { tier: customerTier } = await getEffectiveTier(profile, tiers, tx);
    const tierMultiplier = Number(customerTier?.earnMultiplier ?? 1);

    // "Se aplica el mayor entre nivel y promoción, no se acumulan."
    const effectiveMultiplier = Math.max(1, tierMultiplier, promoRate.multiplier);
    const multiplierBonus = basePoints > 0 ? Math.floor(basePoints * effectiveMultiplier) - basePoints : 0;
    const bonusPoints = multiplierBonus + promoRate.flatBonus;
    const bonusSource = promoRate.multiplier >= tierMultiplier && (promoRate.multiplier > 1 || promoRate.flatBonus > 0)
      ? ("PROMOTION" as const)
      : ("TIER_BONUS" as const);

    const purchasePoints = basePoints + bonusPoints;
    const isFirstOrder = profile.totalOrders === 0;

    const order = await tx.order.create({
      data: {
        customerProfileId: input.customerProfileId,
        employeeId: input.employeeId,
        source: input.source,
        totalAmount,
        paymentMethod: input.paymentMethod,
        externalReference: input.externalReference,
        pointsEarned: purchasePoints,
        notes: input.notes,
        items: resolvedItems.length
          ? {
              create: resolvedItems.map((i) => ({
                productId: i.productId,
                name: i.name,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                subtotal: i.subtotal,
              })),
            }
          : undefined,
      },
    });

    await tx.customerProfile.update({
      where: { id: profile.id },
      data: {
        totalSpent: { increment: totalAmount },
        totalOrders: { increment: 1 },
        firstOrderAt: profile.firstOrderAt ?? order.createdAt,
        lastOrderAt: order.createdAt,
      },
    });

    if (basePoints > 0) {
      await awardPoints(
        {
          customerProfileId: profile.id,
          type: "EARN",
          source: "PURCHASE",
          amount: basePoints,
          description: input.externalReference ? `Compra #${input.externalReference}` : "Compra",
          referenceType: "Order",
          referenceId: order.id,
          silent: true,
        },
        tx
      );
    }

    if (bonusPoints > 0) {
      await awardPoints(
        {
          customerProfileId: profile.id,
          type: "EARN",
          source: bonusSource,
          amount: bonusPoints,
          description:
            bonusSource === "PROMOTION"
              ? "Promoción activa 🎉"
              : `Bono de nivel (${customerTier?.name ?? ""}) 🎉`,
          referenceType: "Order",
          referenceId: order.id,
          silent: true,
        },
        tx
      );
    }

    // Una sola notificación con el total (en vez de una por cada
    // PointTransaction) — el cliente no necesita saber que puntos base y
    // bono de nivel/promo se registran por separado, solo cuánto ganó.
    if (purchasePoints > 0) {
      await notify(
        {
          userId: profile.userId,
          type: "POINTS_EARNED",
          title: `+${purchasePoints} puntos`,
          body:
            bonusPoints > 0
              ? `Compra registrada — incluye bono ${bonusSource === "PROMOTION" ? "de promoción" : "de nivel"}.`
              : "Compra registrada.",
        },
        tx
      );
    }

    if (isFirstOrder && config.firstPurchasePoints > 0) {
      await awardPoints(
        {
          customerProfileId: profile.id,
          type: "BONUS",
          source: "FIRST_PURCHASE",
          amount: config.firstPurchasePoints,
          description: "Primera compra 🎉",
          referenceType: "Order",
          referenceId: order.id,
          silent: true,
        },
        tx
      );
    }

    await evaluateMissionsForOrder(tx, {
      customerProfileId: profile.id,
      order: { id: order.id, totalAmount },
      items: resolvedItems.map((i) => ({
        productId: i.productId,
        category: i.category,
        quantity: i.quantity,
      })),
    });

    // "Visita" (reglas 2026) solo cuenta si la compra llega al mínimo
    // configurado — una compra chica no alimenta rachas ni box sorpresa.
    // Antes de activar las reglas nuevas (activationDate null), cualquier
    // compra sigue contando, igual que hoy en producción.
    const visitQualifies = config.activationDate ? totalAmount >= Number(config.visitMinimumAmount) : true;
    if (visitQualifies) {
      await updateVisitStreak(tx, profile.id, order.createdAt);
    }

    // El referido solo se completa con una compra real de
    // referralMinPurchaseAmount o más — puede no ser la primera (sigue
    // PENDING hasta que alguna compra la alcance). Antes de activar, no hay
    // mínimo (se completa con cualquier compra, igual que hoy).
    const referralMinimum = config.activationDate ? Number(config.referralMinPurchaseAmount) : 0;
    if (totalAmount >= referralMinimum) {
      await completeReferralOnFirstPurchase(tx, profile.id);
    }

    const totalPoints =
      purchasePoints + (isFirstOrder && config.firstPurchasePoints > 0 ? config.firstPurchasePoints : 0);

    return { orderId: order.id, pointsEarned: totalPoints, alreadyProcessed: false };
  });
}

export async function refundOrder(
  orderId: string,
  params: { reason?: string; actorId?: string } = {}
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.status === "REFUNDED") {
      throw new OrderServiceError("ALREADY_REFUNDED", "Esta compra ya fue reembolsada.");
    }

    await tx.order.update({ where: { id: order.id }, data: { status: "REFUNDED" } });

    // Reverses exactly what this order gave, by whichever source it was
    // originally recorded under (PURCHASE base, plus PROMOTION/TIER_BONUS if
    // there was a multiplier bonus) — NOT the welcome FIRST_PURCHASE bonus,
    // which isn't proportional to this specific sale. Doing it this way (vs.
    // a single lump REFUND under source=PURCHASE) keeps the rolling 12-month
    // tier window correct: it only ever reads source=PURCHASE, so a bonus
        // recorded under PROMOTION/TIER_BONUS must also be reversed under that
    // same source, or the window would over-subtract.
    const earnedTransactions = await tx.pointTransaction.findMany({
      where: {
        referenceType: "Order",
        referenceId: order.id,
        type: "EARN",
        source: { in: ["PURCHASE", "PROMOTION", "TIER_BONUS"] },
      },
    });

    for (const t of earnedTransactions) {
      await awardPoints(
        {
          customerProfileId: order.customerProfileId,
          type: "REFUND",
          source: t.source,
          amount: -t.amount,
          description: "Reembolso de compra",
          referenceType: "Order",
          referenceId: order.id,
          silent: true,
        },
        tx
      );
    }

    await recordAuditLog(
      {
        actorId: params.actorId,
        action: "ORDER_REFUNDED",
        entityType: "Order",
        entityId: order.id,
        reason: params.reason,
      },
      tx
    );

    return order;
  });
}

export async function getOrderHistory(customerProfileId: string, db = prisma, take = 50) {
  return db.order.findMany({
    where: { customerProfileId },
    orderBy: { createdAt: "desc" },
    take,
    include: { items: true },
  });
}
