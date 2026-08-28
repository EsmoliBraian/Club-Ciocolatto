import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import type { LoyaltyConfig, OrderSource } from "@prisma/client";
import { awardPoints } from "@/server/services/loyalty-service";
import { getLoyaltyConfig, calculatePointsForAmount } from "@/server/services/config-service";
import { evaluateMissionsForOrder } from "@/server/services/mission-service";
import { completeReferralOnFirstPurchase } from "@/server/services/referral-service";
import { recordAuditLog } from "@/server/services/audit-service";

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
  /** Required when `items` is omitted (e.g. employee entering a flat register total). */
  totalAmount?: number;
  paymentMethod?: string;
  /** POS ticket / order id. Enforces "the same sale never earns points twice". */
  externalReference?: string;
  notes?: string;
  items?: RegisterOrderItemInput[];
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

function computeOrderPoints(totalAmount: number, items: ResolvedItem[], config: LoyaltyConfig): number {
  if (items.length === 0) {
    return calculatePointsForAmount(totalAmount, config);
  }
  return items.reduce((sum, item) => {
    const base = calculatePointsForAmount(item.subtotal, config);
    return sum + Math.floor(base * item.pointsMultiplier) + item.bonusPoints * item.quantity;
  }, 0);
}

async function applyPromotions(db: Db, points: number, items: ResolvedItem[]): Promise<number> {
  if (points <= 0) return points;
  const now = new Date();
  const promotions = await db.promotion.findMany({
    where: { active: true, startAt: { lte: now }, endAt: { gte: now } },
  });

  let multiplier = 1;
  let bonus = 0;
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
    if (promo.type === "POINTS_MULTIPLIER" && promo.multiplier) {
      multiplier = Math.max(multiplier, Number(promo.multiplier));
    }
    if (promo.type === "BONUS_POINTS" && promo.bonusPoints) {
      bonus += promo.bonusPoints;
    }
  }

  return Math.floor(points * multiplier) + bonus;
}

export interface RegisterOrderResult {
  orderId: string;
  pointsEarned: number;
  alreadyProcessed: boolean;
}

/**
 * The purchase orchestrator (the "motor de reglas"): registers the sale,
 * awards points (base + product multipliers/bonuses + active promotions +
 * first-purchase bonus), advances order-driven missions, and completes a
 * pending referral on the customer's first purchase — all in one transaction.
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
      totalAmount = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);
    }

    const basePoints = computeOrderPoints(totalAmount, resolvedItems, config);
    const purchasePoints = await applyPromotions(tx, basePoints, resolvedItems);
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

    if (purchasePoints > 0) {
      await awardPoints(
        {
          customerProfileId: profile.id,
          type: "EARN",
          source: "PURCHASE",
          amount: purchasePoints,
          description: input.externalReference ? `Compra #${input.externalReference}` : "Compra",
          referenceType: "Order",
          referenceId: order.id,
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

    await completeReferralOnFirstPurchase(tx, profile.id);

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

    if (order.pointsEarned > 0) {
      await awardPoints(
        {
          customerProfileId: order.customerProfileId,
          type: "REFUND",
          source: "PURCHASE",
          amount: -order.pointsEarned,
          description: "Reembolso de compra",
          referenceType: "Order",
          referenceId: order.id,
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
