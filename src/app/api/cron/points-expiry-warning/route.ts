import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLoyaltyConfig } from "@/server/services/config-service";
import { notify } from "@/server/services/notification-service";
import { POINTS_EXPIRING_WARNING_WINDOW_DAYS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const LIFETIME_COUNTING_TYPES = ["EARN", "BONUS", "REFUND"] as const;

/**
 * Vercel Cron hits this daily (see vercel.json). Warning-only — no points are
 * ever actually deducted here; `pointsExpireAfterDays` remains otherwise
 * unenforced, exactly as it was before this cron existed.
 *
 * Heuristic (explicitly approximate — there's no per-lot FIFO tracking of
 * which specific points a customer has or hasn't spent yet): a customer's
 * "oldest still-relevant" points are approximated as the oldest EARN/BONUS/
 * REFUND transaction since their balance last hit exactly zero (a
 * balanceAfter = 0 row proves everything before it was already spent). If a
 * customer's balance has never hit zero, their very first transaction is
 * used instead.
 */
export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const config = await getLoyaltyConfig();
  if (config.pointsExpireAfterDays == null) {
    return NextResponse.json({ skipped: true, reason: "pointsExpireAfterDays not configured" });
  }

  const now = new Date();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://club-ciocolatto.vercel.app";

  const candidates = await prisma.customerProfile.findMany({
    where: { pointsBalance: { gt: 0 }, user: { role: "CUSTOMER", active: true } },
    include: { user: true },
  });

  let warned = 0;
  for (const profile of candidates) {
    const lastZero = await prisma.pointTransaction.findFirst({
      where: { customerProfileId: profile.id, balanceAfter: 0 },
      orderBy: { createdAt: "desc" },
    });

    const oldestRelevant = await prisma.pointTransaction.findFirst({
      where: {
        customerProfileId: profile.id,
        type: { in: [...LIFETIME_COUNTING_TYPES] },
        createdAt: lastZero ? { gte: lastZero.createdAt } : undefined,
      },
      orderBy: { createdAt: "asc" },
    });
    if (!oldestRelevant) continue;

    const daysOld = (now.getTime() - oldestRelevant.createdAt.getTime()) / 86_400_000;
    const qualifies = daysOld >= config.pointsExpireAfterDays - POINTS_EXPIRING_WARNING_WINDOW_DAYS;
    if (!qualifies) continue;

    // Idempotency: only re-warn once a genuinely newer "oldest relevant" batch
    // exists than the one we already warned about (i.e. the customer spent
    // down to zero and earned again since) — not just once per calendar day.
    if (profile.lastPointsExpiryWarningAt && profile.lastPointsExpiryWarningAt >= oldestRelevant.createdAt) {
      continue;
    }

    await notify({
      userId: profile.userId,
      type: "POINTS_EXPIRING",
      channel: "EMAIL",
      title: "Tus puntos están por vencer ⏳",
      body: `Usalos antes de que se pierdan. ${appUrl}/canjear`,
    });
    await prisma.customerProfile.update({ where: { id: profile.id }, data: { lastPointsExpiryWarningAt: now } });
    warned++;
  }

  return NextResponse.json({ checked: candidates.length, warned });
}
