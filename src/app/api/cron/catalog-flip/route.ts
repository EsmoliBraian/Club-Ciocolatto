import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLoyaltyConfig } from "@/server/services/config-service";
import { recordAuditLog } from "@/server/services/audit-service";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron, daily (reglas 2026). Applies the NEW reward catalog — prices,
 * removed tier requirements, removed cooldown — exactly once, at
 * `activationDate + gracePeriodDays`. Until then, existing rewards keep
 * their current (pre-2026) values untouched on purpose: that's what lets
 * the 15-day grace period "just work" with zero extra branching in
 * reward-service.ts — the live row IS the old rule until this cron flips it.
 *
 * Idempotent via `catalogFlippedAt`: runs the flip at most once, ever.
 */
export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const config = await getLoyaltyConfig();
  if (!config.activationDate) {
    return NextResponse.json({ skipped: true, reason: "activationDate not set" });
  }
  if (config.catalogFlippedAt) {
    return NextResponse.json({ skipped: true, reason: "already flipped", at: config.catalogFlippedAt });
  }

  const graceEnd = new Date(config.activationDate.getTime() + config.gracePeriodDays * 86_400_000);
  if (new Date() < graceEnd) {
    return NextResponse.json({ skipped: true, reason: "still in grace period", graceEnd });
  }

  await prisma.$transaction(async (tx) => {
    await tx.reward.updateMany({
      where: { id: "seed-reward-cafe" },
      data: { pointsCost: 250, maxProductPrice: 6000 },
    });
    await tx.reward.updateMany({
      where: { id: "seed-reward-medialuna" },
      data: { pointsCost: 250 },
    });
    await tx.reward.updateMany({
      where: { id: "seed-reward-10off" },
      data: { pointsCost: 300, requiredTierId: null, discountPct: 10, discountCapAmount: 4000 },
    });
    await tx.reward.updateMany({
      where: { id: "seed-reward-5000off" },
      data: { pointsCost: 600, requiredTierId: null, discountFixedAmount: 5000, minimumPurchaseAmount: 25000 },
    });
    // El cooldown general por premio lo reemplaza la regla "un canje por
    // visita" (ver reward-service.ts) — se apaga acá, junto con el resto del catálogo.
    await tx.loyaltyConfig.update({
      where: { id: "singleton" },
      data: { rewardCooldownDays: null, catalogFlippedAt: new Date() },
    });
    await recordAuditLog(
      { action: "LOYALTY_CATALOG_FLIPPED_2026", entityType: "LoyaltyConfig", entityId: "singleton" },
      tx
    );
  });

  return NextResponse.json({ flipped: true });
}
