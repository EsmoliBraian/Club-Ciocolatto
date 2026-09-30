import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/server/services/loyalty-service";
import { createReferral } from "@/server/services/referral-service";
import { createTestCustomer, cleanupTestCustomer } from "./helpers";

// Relies on the real seeded LoyaltyConfig.referralDuoMilestoneTierId (defaults
// to "Fan Ciocolatto", minimumPoints 200 — see prisma/seed.ts) rather than
// mutating the shared config singleton, which other test files also read.
describe("loyalty-service: referral duo bonus", () => {
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

  it("pays both sides exactly once, only once BOTH reach the milestone tier", async () => {
    const config = await prisma.loyaltyConfig.findUniqueOrThrow({ where: { id: "singleton" } });
    expect(config.referralDuoMilestoneTierId).not.toBeNull(); // sanity: the seed backfill ran

    const referral = await createReferral(prisma, {
      referrerProfileId: referrer.profile.id,
      refereeProfileId: referee.profile.id,
      codeUsed: referrer.profile.referralCode,
    });
    await prisma.referral.update({ where: { id: referral.id }, data: { status: "COMPLETED" } });

    // Only the referrer crosses the milestone (200) — referee is still at 0,
    // so no duo bonus should fire yet.
    await awardPoints(
      { customerProfileId: referrer.profile.id, type: "EARN", source: "PURCHASE", amount: 250, description: "Test" },
      prisma
    );
    let refreshed = await prisma.referral.findUniqueOrThrow({ where: { id: referral.id } });
    expect(refreshed.duoBonusPaidAt).toBeNull();

    // Now the referee also crosses — both sides qualify, bonus should fire for both.
    await awardPoints(
      { customerProfileId: referee.profile.id, type: "EARN", source: "PURCHASE", amount: 250, description: "Test" },
      prisma
    );
    refreshed = await prisma.referral.findUniqueOrThrow({ where: { id: referral.id } });
    expect(refreshed.duoBonusPaidAt).not.toBeNull();

    const referrerDuoTx = await prisma.pointTransaction.findMany({
      where: { customerProfileId: referrer.profile.id, source: "REFERRAL_DUO" },
    });
    const refereeDuoTx = await prisma.pointTransaction.findMany({
      where: { customerProfileId: referee.profile.id, source: "REFERRAL_DUO" },
    });
    expect(referrerDuoTx).toHaveLength(1);
    expect(refereeDuoTx).toHaveLength(1);
    expect(referrerDuoTx[0].amount).toBe(config.referralDuoBonusPoints);
    expect(refereeDuoTx[0].amount).toBe(config.referralDuoBonusPoints);

    // Crossing yet another tier later (e.g. into Fanático) must not re-pay it.
    await awardPoints(
      { customerProfileId: referrer.profile.id, type: "EARN", source: "PURCHASE", amount: 300, description: "Test" },
      prisma
    );
    const referrerDuoTxAfter = await prisma.pointTransaction.findMany({
      where: { customerProfileId: referrer.profile.id, source: "REFERRAL_DUO" },
    });
    expect(referrerDuoTxAfter).toHaveLength(1);
  });
});
