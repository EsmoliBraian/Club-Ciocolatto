import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLoyaltyConfig } from "@/server/services/config-service";
import { awardPoints, getProtectedBalance } from "@/server/services/loyalty-service";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron, daily (reglas 2026). Actually deducts points — the older
 * /api/cron/points-expiry-warning cron only ever sent an email, this is the
 * one that makes `pointsExpireAfterDays` real.
 *
 * Rule (sección 5.3 del documento de reglas): a customer who has gone
 * `pointsExpireAfterDays` days without a single purchase loses everything
 * above their protected balance — whatever they already had at
 * `activationDate` (see `getProtectedBalance`, computed from the ledger, not
 * a stored column). Naturally idempotent: once a customer's balance reaches
 * their protected floor, there's nothing left to expire, so they're skipped
 * on every subsequent run until they earn new points and go inactive again.
 */
export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const config = await getLoyaltyConfig();
  if (config.pointsExpireAfterDays == null || !config.activationDate) {
    return NextResponse.json({ skipped: true, reason: "pointsExpireAfterDays or activationDate not configured" });
  }

  const cutoff = new Date(Date.now() - config.pointsExpireAfterDays * 86_400_000);

  const candidates = await prisma.customerProfile.findMany({
    where: {
      user: { role: "CUSTOMER", active: true },
      pointsBalance: { gt: 0 },
      // Sin compras nunca (cuenta vieja que nunca volvió) cuenta como
      // inactiva desde que se registró, no como "nunca vence".
      OR: [{ lastOrderAt: { lt: cutoff } }, { lastOrderAt: null, createdAt: { lt: cutoff } }],
    },
  });

  let expiredCount = 0;
  let totalExpired = 0;
  for (const profile of candidates) {
    const protectedBalance = await getProtectedBalance(profile.id, profile.pointsBalance, config.activationDate);
    const toExpire = profile.pointsBalance - protectedBalance;
    if (toExpire <= 0) continue;

    await prisma.$transaction((tx) =>
      awardPoints(
        {
          customerProfileId: profile.id,
          type: "EXPIRATION",
          source: "POINTS_EXPIRED",
          amount: -toExpire,
          description: `Vencimiento por ${config.pointsExpireAfterDays} días sin compras`,
          silent: true,
        },
        tx
      )
    );
    expiredCount++;
    totalExpired += toExpire;
  }

  return NextResponse.json({ checked: candidates.length, expired: expiredCount, pointsExpired: totalExpired });
}
