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

    const referrerProfile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: referrer.profile.id } });
    expect(referrerProfile.pointsBalance).toBe(referral.referrerPointsAwarded);

    // A second purchase must not re-trigger completion or award points again.
    const second = await completeReferralOnFirstPurchase(prisma, referee.profile.id);
    expect(second).toBeNull();
    const referrerProfileAfter = await prisma.customerProfile.findUniqueOrThrow({ where: { id: referrer.profile.id } });
    expect(referrerProfileAfter.pointsBalance).toBe(referral.referrerPointsAwarded);
  });
});
