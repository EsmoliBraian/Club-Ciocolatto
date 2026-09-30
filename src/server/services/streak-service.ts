import type { Db } from "@/types/db";
import { awardPoints } from "@/server/services/loyalty-service";
import { toBusinessWeekIndex } from "@/lib/timezone";
import { VISIT_STREAK_MILESTONES } from "@/lib/constants";

/**
 * Weekly visit streak: any order counts as "a visit this week." A calendar
 * week (Mon-Sun, Buenos Aires local time) with at least one order keeps the
 * streak alive; a skipped week resets it to 1. Milestones (see
 * VISIT_STREAK_MILESTONES) pay a flat bonus once each, tracked via
 * visitStreakMilestoneWeeks as a floor so a streak that keeps climbing
 * doesn't re-pay a milestone it already cleared.
 *
 * Must run inside the same transaction as the order that triggers it.
 */
export async function updateVisitStreak(db: Db, customerProfileId: string, orderCreatedAt: Date): Promise<void> {
  const profile = await db.customerProfile.findUniqueOrThrow({ where: { id: customerProfileId } });
  const newWeekIndex = toBusinessWeekIndex(orderCreatedAt);

  if (profile.visitStreakWeekIndex === newWeekIndex) {
    return; // second (or later) order the same week — no-op, streak already counted
  }

  const gap = profile.visitStreakWeekIndex != null ? newWeekIndex - profile.visitStreakWeekIndex : null;

  const weeks = gap === 1 ? profile.visitStreakWeeks + 1 : 1;
  const milestoneFloor = gap === 1 ? profile.visitStreakMilestoneWeeks : 0;

  await db.customerProfile.update({
    where: { id: customerProfileId },
    data: { visitStreakWeeks: weeks, visitStreakWeekIndex: newWeekIndex, visitStreakMilestoneWeeks: milestoneFloor },
  });

  const milestone = VISIT_STREAK_MILESTONES.find((m) => m.weeks <= weeks && m.weeks > milestoneFloor);
  if (milestone) {
    await db.customerProfile.update({
      where: { id: customerProfileId },
      data: { visitStreakMilestoneWeeks: milestone.weeks },
    });
    await awardPoints(
      {
        customerProfileId,
        type: "BONUS",
        source: "VISIT_STREAK",
        amount: milestone.points,
        description: `Racha de ${milestone.weeks} semanas seguidas 🔥`,
      },
      db
    );
  }
}
