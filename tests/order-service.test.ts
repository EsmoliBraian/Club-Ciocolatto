import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerOrder } from "@/server/services/order-service";
import { getLoyaltyConfig, calculatePointsForAmount } from "@/server/services/config-service";
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

describe("order-service: off-peak time-window promotions", () => {
  let userId: string;
  let profileId: string;
  let promotionId: string;

  beforeEach(async () => {
    const { user, profile } = await createTestCustomer();
    userId = user.id;
    profileId = profile.id;
    // Consumes the first-order bonus up front so later orders in this suite
    // reflect the promotion multiplier alone, undiluted by FIRST_PURCHASE.
    await registerOrder({
      customerProfileId: profileId,
      source: "MANUAL_EMPLOYEE",
      totalAmount: 1000,
      externalReference: `warmup-${randomUUID()}`,
    });
  });

  afterEach(async () => {
    vi.useRealTimers();
    await prisma.promotion.delete({ where: { id: promotionId } }).catch(() => {});
    await cleanupTestCustomer(userId);
  });

  it("applies the multiplier only within the configured day/time window (Buenos Aires local time)", async () => {
    // 2026-01-06T18:00:00Z is Tuesday 15:00 in Buenos Aires (UTC-3) —
    // dayOfWeek 2, minuteOfDay 900. See tests/timezone.test.ts.
    const promotion = await prisma.promotion.create({
      data: {
        name: "Test: martes tarde x2",
        type: "POINTS_MULTIPLIER",
        multiplier: 2,
        daysOfWeek: [2],
        startMinute: 13 * 60,
        endMinute: 17 * 60,
        startAt: new Date("2026-01-01T00:00:00Z"),
        endAt: new Date("2026-12-31T00:00:00Z"),
        active: true,
      },
    });
    promotionId = promotion.id;

    const config = await getLoyaltyConfig();
    const totalAmount = 5000;
    const basePoints = calculatePointsForAmount(totalAmount, config);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-06T18:00:00.000Z")); // inside the window
    const inWindow = await registerOrder({
      customerProfileId: profileId,
      source: "MANUAL_EMPLOYEE",
      totalAmount,
      externalReference: `promo-in-window-${randomUUID()}`,
    });
    expect(inWindow.pointsEarned).toBe(basePoints * 2);

    vi.setSystemTime(new Date("2026-01-07T18:00:00.000Z")); // Wednesday — same hour, wrong day
    const outOfWindow = await registerOrder({
      customerProfileId: profileId,
      source: "MANUAL_EMPLOYEE",
      totalAmount,
      externalReference: `promo-out-of-window-${randomUUID()}`,
    });
    expect(outOfWindow.pointsEarned).toBe(basePoints);
  });
});
