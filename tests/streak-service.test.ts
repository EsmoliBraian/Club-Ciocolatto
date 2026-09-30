import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { updateVisitStreak } from "@/server/services/streak-service";
import { createTestCustomer, cleanupTestCustomer } from "./helpers";

// Monday of a fixed, arbitrary ISO week — every date below is expressed as
// an offset from it so the test is independent of when it actually runs.
const WEEK_1_MONDAY = new Date("2026-06-01T10:00:00Z");
const days = (n: number) => new Date(WEEK_1_MONDAY.getTime() + n * 86_400_000);

describe("streak-service: updateVisitStreak", () => {
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

  it("starts a streak at 1 on the first visit", async () => {
    await updateVisitStreak(prisma, profileId, days(0));
    const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.visitStreakWeeks).toBe(1);
  });

  it("a second order the same week is a no-op, not a double increment", async () => {
    await updateVisitStreak(prisma, profileId, days(0)); // Monday week 1
    await updateVisitStreak(prisma, profileId, days(3)); // Thursday week 1 — same week
    const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.visitStreakWeeks).toBe(1);
  });

  it("an order the following week increments the streak", async () => {
    await updateVisitStreak(prisma, profileId, days(0)); // week 1
    await updateVisitStreak(prisma, profileId, days(7)); // week 2
    const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.visitStreakWeeks).toBe(2);
  });

  it("skipping a week resets the streak to 1", async () => {
    await updateVisitStreak(prisma, profileId, days(0)); // week 1
    await updateVisitStreak(prisma, profileId, days(7)); // week 2
    await updateVisitStreak(prisma, profileId, days(21)); // week 4 — week 3 skipped
    const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.visitStreakWeeks).toBe(1);
  });

  it("pays the 4-week milestone exactly once when crossed, and doesn't re-pay it on week 5", async () => {
    for (let week = 0; week < 4; week++) {
      await updateVisitStreak(prisma, profileId, days(week * 7));
    }
    const afterMilestone = await prisma.pointTransaction.findMany({
      where: { customerProfileId: profileId, source: "VISIT_STREAK" },
    });
    expect(afterMilestone).toHaveLength(1);
    expect(afterMilestone[0].amount).toBe(50);

    await updateVisitStreak(prisma, profileId, days(4 * 7)); // week 5 — not a milestone
    const afterWeek5 = await prisma.pointTransaction.findMany({
      where: { customerProfileId: profileId, source: "VISIT_STREAK" },
    });
    expect(afterWeek5).toHaveLength(1);
  });
});
