import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLoyaltyConfig } from "@/server/services/config-service";
import { listActiveTiers, getEffectiveTier } from "@/server/services/tier-service";
import { grantFreeReward } from "@/server/services/reward-service";
import { sendEmail, winbackEmailHtml } from "@/lib/email";
import { WINBACK_COUPON_REWARD_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron hits this daily (see vercel.json). Finds customers at or above
 * the configured tier who've gone quiet, sends them a discount coupon (no
 * points — this is a nudge, distinct from the birthday/anniversary gifts
 * which pay both), and throttles to at most once per rolling 30 days per
 * customer so it can't spam someone who stays inactive.
 */
export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const config = await getLoyaltyConfig();
  if (!config.winbackMinimumTierId) {
    return NextResponse.json({ skipped: true, reason: "winbackMinimumTierId not configured" });
  }

  const tiers = await listActiveTiers();
  const milestoneRank = tiers.findIndex((t) => t.id === config.winbackMinimumTierId);
  if (milestoneRank === -1) {
    return NextResponse.json({ skipped: true, reason: "configured tier not found/active" });
  }

  const now = new Date();
  const inactivityCutoff = new Date(now.getTime() - config.winbackInactivityDays * 86_400_000);
  const throttleCutoff = new Date(now.getTime() - config.winbackMaxFrequencyDays * 86_400_000);

  const candidates = await prisma.customerProfile.findMany({
    where: {
      lastOrderAt: { not: null, lt: inactivityCutoff },
      OR: [{ lastWinbackSentAt: null }, { lastWinbackSentAt: { lte: throttleCutoff } }],
      user: { role: "CUSTOMER", active: true },
    },
    include: { user: true },
  });

  const eligibility = await Promise.all(
    candidates.map(async (profile) => {
      const { tier } = await getEffectiveTier(profile, tiers);
      const rank = tier ? tiers.findIndex((t) => t.id === tier.id) : -1;
      return rank >= milestoneRank;
    })
  );
  const eligible = candidates.filter((_, i) => eligibility[i]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://club-ciocolatto.vercel.app";

  // El % y el tope del cupón son configurables (config.winbackDiscountCap) —
  // se sincronizan en el reward antes de otorgarlo, así markRedemptionUsed
  // (que lee reward.discountPct/discountCapAmount, no la config directamente)
  // siempre calcula el descuento con el tope vigente.
  await prisma.reward.update({
    where: { id: WINBACK_COUPON_REWARD_ID },
    data: { discountPct: 10, discountCapAmount: config.winbackDiscountCap },
  });

  let sent = 0;
  for (const profile of eligible) {
    try {
      await prisma.$transaction(async (tx) => {
        await grantFreeReward(tx, {
          customerProfileId: profile.id,
          rewardId: WINBACK_COUPON_REWARD_ID,
          notificationTitle: "Te extrañamos ☕",
          notificationBody: `Te dejamos un 10% OFF (hasta $${Number(config.winbackDiscountCap).toLocaleString("es-AR")}) para tu próxima visita, válido ${config.winbackValidDays} días — mostrá el código en caja.`,
          expiresInHours: config.winbackValidDays * 24,
        });
        await tx.customerProfile.update({ where: { id: profile.id }, data: { lastWinbackSentAt: now } });
      });
      // Sent directly (not via notify()) so this doesn't also create a second,
      // near-duplicate in-app bell entry alongside grantFreeReward's own.
      await sendEmail({
        to: profile.user.email,
        subject: "Te extrañamos ☕",
        html: winbackEmailHtml({ firstName: profile.user.firstName, appUrl }),
      });
      sent++;
    } catch (error) {
      console.error(`[cron/winback] failed for customer ${profile.id}`, error);
    }
  }

  return NextResponse.json({ checked: candidates.length, matched: eligible.length, sent });
}
