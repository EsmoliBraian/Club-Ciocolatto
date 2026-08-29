import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  validateReferralCode,
  createReferral,
  completeReferralOnFirstPurchase,
  ReferralError,
} from "@/server/services/referral-service";
import { registerOrder } from "@/server/services/order-service";
import { createTestCustomer, cleanupTestCustomer } from "./helpers";

describe("referral-service", () => {
  let referrer: Awaited<ReturnType<typeof createTestCustomer>>;
  let referee: Awaited<ReturnType<typeof createTestCustomer>>;

  beforeEach(async () => {
    referrer = await createTestCustomer();
    referee = await createTestCustomer();
  });

  afterEach(async () => {
    await cleanupTestCustomer(referrer.user.id);
    await cleanupTestCustomer(referee.user.id);
  });

  it("rejects a self-referral (same email/phone as the sponsor)", async () => {
    await expect(
      validateReferralCode(referrer.profile.referralCode, {
        email: referrer.user.email,
        phone: referrer.user.phone,
      })
    ).rejects.toThrow(ReferralError);
  });

  it("accepts a valid code from a different customer", async () => {
    const resolved = await validateReferralCode(referrer.profile.referralCode, {
      email: referee.user.email,
      phone: referee.user.phone,
    });
    expect(resolved.id).toBe(referrer.profile.id);
  });

  it("prevents a referee from ever having more than one sponsor", async () => {
    const thirdParty = await createTestCustomer();
    try {
      await createReferral(prisma, {
        referrerProfileId: referrer.profile.id,
        refereeProfileId: referee.profile.id,
        codeUsed: referrer.profile.referralCode,
      });

      await expect(
        createReferral(prisma, {
          referrerProfileId: thirdParty.profile.id,
          refereeProfileId: referee.profile.id, // same referee — must violate the unique constraint
          codeUsed: thirdParty.profile.referralCode,
        })
      ).rejects.toThrow();
    } finally {
      await cleanupTestCustomer(thirdParty.user.id);
    }
  });

  it("completes on the referee's first purchase and awards points to both sides exactly once", async () => {
    await createReferral(prisma, {
      referrerProfileId: referrer.profile.id,
      refereeProfileId: referee.profile.id,
      codeUsed: referrer.profile.referralCode,
    });

    await registerOrder({
      customerProfileId: referee.profile.id,
      source: "MANUAL_EMPLOYEE",
      totalAmount: 5000,
      externalReference: `referral-test-${referee.profile.id}`,
    });

    const referral = await prisma.referral.findUniqueOrThrow({ where: { refereeId: referee.profile.id } });
    expect(referral.status).toBe("COMPLETED");
    expect(referral.referrerPointsAwarded).toBeGreaterThan(0);

    // Scoped to the flat per-referral bonus specifically — not the referrer's
    // overall balance, which may also include unrelated milestone-mission
    // rewards (e.g. "invitá a 5 amigos") depending on what's seeded.
    const sponsorTx = await prisma.pointTransaction.findMany({
      where: { customerProfileId: referrer.profile.id, source: "REFERRAL_SPONSOR" },
    });
    expect(sponsorTx).toHaveLength(1);
    expect(sponsorTx[0].amount).toBe(referral.referrerPointsAwarded);

    // A second purchase must not re-trigger completion or award points again.
    const second = await completeReferralOnFirstPurchase(prisma, referee.profile.id);
    expect(second).toBeNull();
    const sponsorTxAfter = await prisma.pointTransaction.findMany({
      where: { customerProfileId: referrer.profile.id, source: "REFERRAL_SPONSOR" },
    });
    expect(sponsorTxAfter).toHaveLength(1);
  });

  it("pays out a referral milestone mission once the target is reached, and only once", async () => {
    // High, unusual target so this never collides with real seed missions (1/5/10).
    const mission = await prisma.mission.upsert({
      where: { id: "test-mission-referral-milestone" },
      update: { active: true, targetValue: 3, rewardPoints: 999, perUserLimit: 1 },
      create: {
        id: "test-mission-referral-milestone",
        name: "Test: invitá a 3 amigos",
        description: "test-only",
        type: "REFERRAL",
        targetValue: 3,
        rewardPoints: 999,
        perUserLimit: 1,
        active: true,
      },
    });

    const referees = [referee, await createTestCustomer(), await createTestCustomer()];
    try {
      for (const [i, ref] of referees.entries()) {
        await createReferral(prisma, {
          referrerProfileId: referrer.profile.id,
          refereeProfileId: ref.profile.id,
          codeUsed: referrer.profile.referralCode,
        });
        await registerOrder({
          customerProfileId: ref.profile.id,
          source: "MANUAL_EMPLOYEE",
          totalAmount: 5000,
          externalReference: `referral-milestone-test-${ref.profile.id}-${i}`,
        });
      }

      const progress = await prisma.missionProgress.findUniqueOrThrow({
        where: {
          missionId_customerProfileId_cycleKey: {
            missionId: mission.id,
            customerProfileId: referrer.profile.id,
            cycleKey: "once",
          },
        },
      });
      expect(progress.currentValue).toBe(3);
      expect(progress.status).toBe("REWARD_CLAIMED");

      const missionTx = await prisma.pointTransaction.findMany({
        where: { customerProfileId: referrer.profile.id, source: "MISSION", referenceId: mission.id },
      });
      expect(missionTx).toHaveLength(1);
      expect(missionTx[0].amount).toBe(999);
    } finally {
      for (const ref of referees.slice(1)) {
        await cleanupTestCustomer(ref.user.id);
      }
      await prisma.missionProgress.deleteMany({ where: { missionId: mission.id } });
      await prisma.mission.delete({ where: { id: mission.id } });
    }
  });
});
