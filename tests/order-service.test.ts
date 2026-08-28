import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerOrder } from "@/server/services/order-service";
import { createTestCustomer, cleanupTestCustomer } from "./helpers";
import { randomUUID } from "crypto";

describe("order-service: registerOrder idempotency", () => {
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

  it("never awards points twice for the same externalReference", async () => {
    const externalReference = `dupe-test-${randomUUID()}`;

    const first = await registerOrder({
      customerProfileId: profileId,
      source: "POS_INTEGRATION",
      totalAmount: 10_000,
      externalReference,
    });
    const replay = await registerOrder({
      customerProfileId: profileId,
      source: "POS_INTEGRATION",
      totalAmount: 10_000,
      externalReference,
    });

    expect(first.alreadyProcessed).toBe(false);
    expect(replay.alreadyProcessed).toBe(true);
    expect(replay.orderId).toBe(first.orderId);

    const orderCount = await prisma.order.count({ where: { customerProfileId: profileId } });
    expect(orderCount).toBe(1);

    const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.pointsBalance).toBe(first.pointsEarned); // not double-counted
  });

  it("awards the first-purchase bonus only on the customer's first order", async () => {
    const first = await registerOrder({
      customerProfileId: profileId,
      source: "MANUAL_EMPLOYEE",
      totalAmount: 1000,
      externalReference: `first-${randomUUID()}`,
    });
    const second = await registerOrder({
      customerProfileId: profileId,
      source: "MANUAL_EMPLOYEE",
      totalAmount: 1000,
      externalReference: `second-${randomUUID()}`,
    });

    const firstPurchaseTx = await prisma.pointTransaction.findMany({
      where: { customerProfileId: profileId, source: "FIRST_PURCHASE" },
    });
    expect(firstPurchaseTx).toHaveLength(1);
    expect(first.pointsEarned).toBeGreaterThan(second.pointsEarned); // first includes the bonus, second doesn't
  });
});
