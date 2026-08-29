import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  evaluateMissionsForOrder,
  getMissionsForCustomer,
  filterVisibleMissions,
  type MissionWithProgress,
} from "@/server/services/mission-service";
import { createTestCustomer, cleanupTestCustomer } from "./helpers";
import { randomUUID } from "crypto";

function fakeMission(overrides: Partial<MissionWithProgress["mission"]> & { targetValue: number }): MissionWithProgress["mission"] {
  return {
    id: `fake-${overrides.targetValue}-${Math.random()}`,
    name: `Invitá a ${overrides.targetValue} amigos`,
    description: "test",
    icon: null,
    type: "REFERRAL",
    productId: null,
    category: null,
    rewardPoints: 0,
    rewardId: null,
    startAt: null,
    endAt: null,
    perUserLimit: 1,
    segment: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("mission-service: evaluateMissionsForOrder", () => {
  let userId: string;
  let profileId: string;
  let missionId: string;

  beforeEach(async () => {
    const { user, profile } = await createTestCustomer();
    userId = user.id;
    profileId = profile.id;

    const mission = await prisma.mission.create({
      data: {
        name: `Test Mission ${randomUUID().slice(0, 6)}`,
        description: "Visit 3 times",
        type: "VISIT_COUNT",
        targetValue: 3,
        rewardPoints: 100,
        perUserLimit: 1,
      },
    });
    missionId = mission.id;
  });

  afterEach(async () => {
    await cleanupTestCustomer(userId);
    await prisma.mission.delete({ where: { id: missionId } }).catch(() => {});
  });

  // NOTE: evaluateMissionsForOrder advances every active VISIT_COUNT mission at
  // once — including the real seeded "Misión Merienda" if this DB has been
  // seeded — so assertions target this test's own mission specifically rather
  // than the customer's global pointsBalance or an unfiltered mission list.

  it("advances progress by one per order and does not complete before the target", async () => {
    await evaluateMissionsForOrder(prisma, {
      customerProfileId: profileId,
      order: { id: "order-1", totalAmount: 1000 },
      items: [],
    });
    await evaluateMissionsForOrder(prisma, {
      customerProfileId: profileId,
      order: { id: "order-2", totalAmount: 1000 },
      items: [],
    });

    const missions = await getMissionsForCustomer(profileId);
    const progress = missions.find((m) => m.mission.id === missionId)!;
    expect(progress.currentValue).toBe(2);
    expect(progress.status).toBe("IN_PROGRESS");
  });

  it("completes at the target, awards the reward once, and ignores further events that cycle", async () => {
    for (let i = 0; i < 3; i++) {
      await evaluateMissionsForOrder(prisma, {
        customerProfileId: profileId,
        order: { id: `order-${i}`, totalAmount: 1000 },
        items: [],
      });
    }

    const missionPointTransactions = await prisma.pointTransaction.count({
      where: { customerProfileId: profileId, referenceType: "Mission", referenceId: missionId },
    });
    expect(missionPointTransactions).toBe(1);

    const missions = await getMissionsForCustomer(profileId);
    const progress = missions.find((m) => m.mission.id === missionId)!;
    expect(progress.status).toBe("REWARD_CLAIMED");
    expect(progress.currentValue).toBe(3);

    // A 4th visit must not push progress past the target or award points again
    // (perUserLimit: 1, open-ended mission ⇒ single "once" cycle).
    await evaluateMissionsForOrder(prisma, {
      customerProfileId: profileId,
      order: { id: "order-4", totalAmount: 1000 },
      items: [],
    });
    const missionPointTransactionsAfterExtra = await prisma.pointTransaction.count({
      where: { customerProfileId: profileId, referenceType: "Mission", referenceId: missionId },
    });
    expect(missionPointTransactionsAfterExtra).toBe(1);
  });
});

describe("mission-service: filterVisibleMissions", () => {
  it("shows only the lowest not-yet-claimed REFERRAL tier, hiding higher ones until unlocked", () => {
    const missions: MissionWithProgress[] = [
      { mission: fakeMission({ targetValue: 1 }), currentValue: 0, status: "IN_PROGRESS" },
      { mission: fakeMission({ targetValue: 5 }), currentValue: 0, status: "IN_PROGRESS" },
      { mission: fakeMission({ targetValue: 10 }), currentValue: 0, status: "IN_PROGRESS" },
    ];

    const visible = filterVisibleMissions(missions);
    expect(visible).toHaveLength(1);
    expect(visible[0].mission.targetValue).toBe(1);
  });

  it("unlocks the next tier once the current one is REWARD_CLAIMED, carrying the already-earned progress", () => {
    const missions: MissionWithProgress[] = [
      { mission: fakeMission({ targetValue: 1 }), currentValue: 1, status: "REWARD_CLAIMED" },
      { mission: fakeMission({ targetValue: 5 }), currentValue: 1, status: "IN_PROGRESS" },
      { mission: fakeMission({ targetValue: 10 }), currentValue: 1, status: "IN_PROGRESS" },
    ];

    const visible = filterVisibleMissions(missions);
    // The claimed tier still shows (it belongs in "Completadas"); the next
    // one shows too, already reading "1/5" instead of restarting at "0/5".
    expect(visible.map((m) => m.mission.targetValue)).toEqual([1, 5]);
    const nextTier = visible.find((m) => m.mission.targetValue === 5)!;
    expect(nextTier.currentValue).toBe(1);
    expect(nextTier.status).toBe("IN_PROGRESS");
  });

  it("leaves non-REFERRAL missions untouched", () => {
    const missions: MissionWithProgress[] = [
      { mission: fakeMission({ targetValue: 1 }), currentValue: 0, status: "IN_PROGRESS" },
      { mission: fakeMission({ targetValue: 5 }), currentValue: 0, status: "IN_PROGRESS" },
      { mission: { ...fakeMission({ targetValue: 3 }), type: "VISIT_COUNT" }, currentValue: 1, status: "IN_PROGRESS" },
    ];

    const visible = filterVisibleMissions(missions);
    expect(visible).toHaveLength(2); // the VISIT_COUNT mission + only the first REFERRAL tier
    expect(visible.some((m) => m.mission.type === "VISIT_COUNT")).toBe(true);
  });
});
