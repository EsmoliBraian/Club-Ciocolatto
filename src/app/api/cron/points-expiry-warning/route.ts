import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLoyaltyConfig } from "@/server/services/config-service";
import { notify } from "@/server/services/notification-service";
import { POINTS_EXPIRING_WARNING_WINDOW_DAYS } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron hits this daily (see vercel.json). Warning-only — the actual
 * deduction happens in /api/cron/points-expiry. Fires once, `POINTS_EXPIRING_
 * WARNING_WINDOW_DAYS` before a customer's inactivity would cross
 * `pointsExpireAfterDays`, and only for customers who'd actually lose
 * something (balance above their protected floor).
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
  const warnAfterDays = config.pointsExpireAfterDays - POINTS_EXPIRING_WARNING_WINDOW_DAYS;
  const warnCutoff = new Date(now.getTime() - warnAfterDays * 86_400_000);

  const candidates = await prisma.customerProfile.findMany({
    where: {
      user: { role: "CUSTOMER", active: true },
      pointsBalance: { gt: 0 },
      OR: [{ lastOrderAt: { lt: warnCutoff } }, { lastOrderAt: null, createdAt: { lt: warnCutoff } }],
    },
    include: { user: true },
  });

  let warned = 0;
  for (const profile of candidates) {
    if (profile.pointsBalance <= profile.protectedBalance) continue; // nothing at risk

    const anchor = profile.lastOrderAt ?? profile.createdAt;
    // Idempotency: only once per inactivity stretch — re-warn only if they've
    // ordered (and gone inactive again) since the last warning.
    if (profile.lastPointsExpiryWarningAt && profile.lastPointsExpiryWarningAt >= anchor) continue;

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
