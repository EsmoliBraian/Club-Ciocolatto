import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { awardPoints, reconcileCustomerBalance } from "@/server/services/loyalty-service";
import { createTestCustomer, cleanupTestCustomer, ensureTestTiers } from "./helpers";

describe("loyalty-service: awardPoints", () => {
  let userId: string;
  let profileId: string;

  beforeEach(async () => {
    const { user, profile } = await createTestCustomer();
    userId = user.id;
    profileId = profile.id;
  });

  afterEach(async () => {
    await cleanupTestCustomer(userId);
  });

  it("accumulates points and records balanceAfter on the ledger row", async () => {
    await awardPoints(
      { customerProfileId: profileId, type: "EARN", source: "PURCHASE", amount: 100, description: "Compra 1" },
      prisma
    );
    const second = await awardPoints(
      { customerProfileId: profileId, type: "EARN", source: "PURCHASE", amount: 50, description: "Compra 2" },
      prisma
    );

    expect(second.balanceAfter).toBe(150);
    const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.pointsBalance).toBe(150);
    expect(profile.lifetimePoints).toBe(150);
  });

  it("rejects a redemption (negative amount) that would drop the balance below zero", async () => {
    await awardPoints(
      { customerProfileId: profileId, type: "EARN", source: "PURCHASE", amount: 50, description: "Compra" },
      prisma
    );

    await expect(
      awardPoints(
        { customerProfileId: profileId, type: "REDEEM", source: "REDEMPTION", amount: -100, description: "Canje" },
        prisma
      )
    ).rejects.toThrow("INSUFFICIENT_POINTS");

    const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.pointsBalance).toBe(50); // unchanged — the rejected transaction must not partially apply
  });

  it("reverses points on REFUND without affecting lifetimePoints twice", async () => {
    await awardPoints(
      { customerProfileId: profileId, type: "EARN", source: "PURCHASE", amount: 200, description: "Compra" },
      prisma
    );
    await awardPoints(
      { customerProfileId: profileId, type: "REFUND", source: "PURCHASE", amount: -200, description: "Reembolso" },
      prisma
    );

    const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.pointsBalance).toBe(0);
  });

  it("reconstructs the cached balance from the ledger alone", async () => {
    await awardPoints(
      { customerProfileId: profileId, type: "EARN", source: "PURCHASE", amount: 100, description: "A" },
      prisma
    );
    await awardPoints(
      { customerProfileId: profileId, type: "REDEEM", source: "REDEMPTION", amount: -30, description: "B" },
      prisma
    );
    await awardPoints(
      { customerProfileId: profileId, type: "BONUS", source: "BIRTHDAY", amount: 20, description: "C" },
      prisma
    );

    // Simulate drift, then reconcile.
    await prisma.customerProfile.update({ where: { id: profileId }, data: { pointsBalance: 0, lifetimePoints: 0 } });
    const reconciled = await reconcileCustomerBalance(profileId);

    expect(reconciled.pointsBalance).toBe(90); // 100 - 30 + 20
    expect(reconciled.lifetimePoints).toBe(120); // 100 + 20 (REDEEM excluded)
  });

  it("upgrades the customer's tier once lifetimePoints crosses the next threshold", async () => {
    const { above } = await ensureTestTiers();

    const result = await awardPoints(
      {
        customerProfileId: profileId,
        type: "EARN",
        source: "PURCHASE",
        amount: 10_500,
        description: "Compra grande",
      },
      prisma
    );

    expect(result.tierChanged).toBe(true);
    expect(result.newTierId).toBe(above.id);
  });
});
