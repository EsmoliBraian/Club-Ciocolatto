import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import type { Mission, MissionProgress } from "@prisma/client";
import { awardPoints } from "@/server/services/loyalty-service";
import { notify } from "@/server/services/notification-service";

const ORDER_DRIVEN_TYPES = [
  "PURCHASE_COUNT",
  "VISIT_COUNT",
  "SPEND_AMOUNT",
  "PRODUCT_PURCHASE",
  "CATEGORY_PURCHASE",
] as const;

/**
 * A mission with a fixed campaign window (startAt/endAt) runs once per
 * customer for that window. An open-ended mission with perUserLimit > 1 is
 * treated as monthly-recurring ("visitá 3 veces este mes"); perUserLimit = 1
 * and open-ended means it can only ever be completed once.
 */
export function computeCycleKey(mission: Pick<Mission, "id" | "startAt" | "endAt" | "perUserLimit">): string {
  if (mission.startAt || mission.endAt) return mission.id;
  if (mission.perUserLimit > 1) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  return "once";
}

export interface OrderMissionContext {
  customerProfileId: string;
  order: { id: string; totalAmount: number };
  items: { productId: string | null; category: string | null; quantity: number }[];
}

export interface MissionEvaluationResult {
  mission: Mission;
  progress: MissionProgress;
  justCompleted: boolean;
}

/** Advances every order-driven mission applicable to this purchase. Call inside the order transaction. */
export async function evaluateMissionsForOrder(
  db: Db,
  ctx: OrderMissionContext
): Promise<MissionEvaluationResult[]> {
  const now = new Date();
  const missions = await db.mission.findMany({
    where: {
      active: true,
      type: { in: [...ORDER_DRIVEN_TYPES] },
      OR: [{ startAt: null }, { startAt: { lte: now } }],
    },
  });

  const applicable = missions.filter((m) => !m.endAt || m.endAt >= now);

  const results: MissionEvaluationResult[] = [];
  for (const mission of applicable) {
    const increment = incrementFor(mission, ctx);
    if (increment <= 0) continue;
    const applied = await applyMissionProgress(db, mission, ctx.customerProfileId, increment);
    if (applied) results.push(applied);
  }
  return results;
}

function incrementFor(mission: Mission, ctx: OrderMissionContext): number {
  switch (mission.type) {
    case "PURCHASE_COUNT":
    case "VISIT_COUNT":
      return 1;
    case "SPEND_AMOUNT":
      return Math.round(ctx.order.totalAmount);
    case "PRODUCT_PURCHASE":
      return ctx.items
        .filter((i) => i.productId === mission.productId)
        .reduce((sum, i) => sum + i.quantity, 0);
    case "CATEGORY_PURCHASE":
      return ctx.items
        .filter((i) => mission.category && i.category === mission.category)
        .reduce((sum, i) => sum + i.quantity, 0);
    default:
      return 0;
  }
}

async function applyMissionProgress(
  db: Db,
  mission: Mission,
  customerProfileId: string,
  increment: number
): Promise<MissionEvaluationResult | null> {
  const cycleKey = computeCycleKey(mission);

  const existing = await db.missionProgress.findUnique({
    where: {
      missionId_customerProfileId_cycleKey: { missionId: mission.id, customerProfileId, cycleKey },
    },
  });

  if (existing && existing.status !== "IN_PROGRESS") {
    return null; // already completed this cycle
  }

  const currentValue = Math.min((existing?.currentValue ?? 0) + increment, mission.targetValue);
  const justCompleted = currentValue >= mission.targetValue;

  const progress = existing
    ? await db.missionProgress.update({
        where: { id: existing.id },
        data: {
          currentValue,
          status: justCompleted ? "COMPLETED" : "IN_PROGRESS",
          completedAt: justCompleted ? new Date() : existing.completedAt,
        },
      })
    : await db.missionProgress.create({
        data: {
          missionId: mission.id,
          customerProfileId,
          cycleKey,
          currentValue,
          status: justCompleted ? "COMPLETED" : "IN_PROGRESS",
          completedAt: justCompleted ? new Date() : null,
        },
      });

  if (justCompleted) {
    await claimMissionReward(db, mission, progress, customerProfileId);
  }

  return { mission, progress, justCompleted };
}

async function claimMissionReward(
  db: Db,
  mission: Mission,
  progress: MissionProgress,
  customerProfileId: string
) {
  await db.missionProgress.update({
    where: { id: progress.id },
    data: { status: "REWARD_CLAIMED", claimedAt: new Date() },
  });

  const profile = await db.customerProfile.findUniqueOrThrow({ where: { id: customerProfileId } });

  if (mission.rewardPoints > 0) {
    await awardPoints(
      {
        customerProfileId,
        type: "EARN",
        source: "MISSION",
        amount: mission.rewardPoints,
        description: `Misión completada: ${mission.name}`,
        referenceType: "Mission",
        referenceId: mission.id,
        silent: true,
      },
      db
    );
  }

  await notify(
    {
      userId: profile.userId,
      type: "MISSION_COMPLETED",
      title: "¡Misión completada! 🔥",
      body:
        mission.rewardPoints > 0
          ? `${mission.name}: +${mission.rewardPoints} puntos`
          : mission.name,
    },
    db
  );
}

/**
 * Advances every active REFERRAL mission for a sponsor after one of their
 * referrals completes. REFERRAL isn't order-driven (evaluateMissionsForOrder
 * skips it), so this is the only place referral-mission progress is ever
 * written — call it from completeReferralOnFirstPurchase. Reuses
 * applyMissionProgress so a milestone ladder (e.g. 1/5/10 friends) just
 * needs one Mission row per milestone; each tracks and pays out independently.
 */
export async function evaluateReferralMissions(
  db: Db,
  customerProfileId: string
): Promise<MissionEvaluationResult[]> {
  const now = new Date();
  const missions = await db.mission.findMany({
    where: {
      active: true,
      type: "REFERRAL",
      OR: [{ startAt: null }, { startAt: { lte: now } }],
    },
  });
  const applicable = missions.filter((m) => !m.endAt || m.endAt >= now);
  if (applicable.length === 0) return [];

  const completedCount = await db.referral.count({
    where: { referrerId: customerProfileId, status: "COMPLETED" },
  });

  const results: MissionEvaluationResult[] = [];
  for (const mission of applicable) {
    const cycleKey = computeCycleKey(mission);
    const existing = await db.missionProgress.findUnique({
      where: { missionId_customerProfileId_cycleKey: { missionId: mission.id, customerProfileId, cycleKey } },
    });
    if (existing && existing.status !== "IN_PROGRESS") continue;

    const increment = completedCount - (existing?.currentValue ?? 0);
    if (increment <= 0) continue;

    const applied = await applyMissionProgress(db, mission, customerProfileId, increment);
    if (applied) results.push(applied);
  }
  return results;
}

/** Products actually referenced by an active PRODUCT_PURCHASE mission — the
 * curated list an employee/admin can tag on a manual purchase, so a checkout
 * never offers a product with no mission behind it. */
export async function listMissionLinkedProducts(db: Db = prisma) {
  const now = new Date();
  const missions = await db.mission.findMany({
    where: {
      active: true,
      type: "PRODUCT_PURCHASE",
      productId: { not: null },
      OR: [{ startAt: null }, { startAt: { lte: now } }],
    },
    include: { product: true },
  });
  const applicable = missions.filter((m) => !m.endAt || m.endAt >= now);

  const byId = new Map<string, NonNullable<(typeof applicable)[number]["product"]>>();
  for (const mission of applicable) {
    if (mission.product?.active) byId.set(mission.product.id, mission.product);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export interface MissionWithProgress {
  mission: Mission;
  currentValue: number;
  status: MissionProgress["status"];
}

export async function getMissionsForCustomer(
  customerProfileId: string,
  db: Db = prisma
): Promise<MissionWithProgress[]> {
  const now = new Date();
  const missions = await db.mission.findMany({
    where: {
      active: true,
      OR: [{ startAt: null }, { startAt: { lte: now } }],
    },
    orderBy: { createdAt: "desc" },
  });
  const applicable = missions.filter((m) => !m.endAt || m.endAt >= now);

  const progresses = await db.missionProgress.findMany({
    where: { customerProfileId, missionId: { in: applicable.map((m) => m.id) } },
  });

  return applicable.map((mission) => {
    const cycleKey = computeCycleKey(mission);
    const progress = progresses.find((p) => p.missionId === mission.id && p.cycleKey === cycleKey);
    return {
      mission,
      currentValue: progress?.currentValue ?? 0,
      status: progress?.status ?? "IN_PROGRESS",
    };
  });
}
