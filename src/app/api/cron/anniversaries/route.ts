import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/server/services/notification-service";

export const dynamic = "force-dynamic";

function isAnniversaryToday(createdAt: Date, now: Date): boolean {
  return (
    createdAt.getUTCMonth() === now.getUTCMonth() &&
    createdAt.getUTCDate() === now.getUTCDate() &&
    now.getUTCFullYear() > createdAt.getUTCFullYear()
  );
}

/**
 * Vercel Cron hits this daily (see vercel.json). Sends an anniversary email —
 * the in-app gift claim (claimAnniversaryReward) is unaffected, this only
 * nudges customers back into the app on their day. Guarded so a retry or a
 * second invocation the same day can't double-send.
 */
export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const candidates = await prisma.customerProfile.findMany({
    where: { user: { role: "CUSTOMER", active: true } },
    select: { id: true, userId: true, createdAt: true },
  });

  const anniversaryProfiles = candidates.filter((p) => isAnniversaryToday(p.createdAt, now));

  let sent = 0;
  for (const profile of anniversaryProfiles) {
    const alreadySentToday = await prisma.notification.findFirst({
      where: { userId: profile.userId, type: "ANNIVERSARY", createdAt: { gte: startOfToday } },
    });
    if (alreadySentToday) continue;

    await notify({
      userId: profile.userId,
      type: "ANNIVERSARY",
      channel: "EMAIL",
      title: "¡Feliz aniversario! 🎉",
      body: "Tenés un regalo esperándote por tu año en el Club Ciocolatto.",
    });
    sent++;
  }

  return NextResponse.json({ checked: candidates.length, matched: anniversaryProfiles.length, sent });
}
