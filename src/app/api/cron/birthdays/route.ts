import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/server/services/notification-service";

export const dynamic = "force-dynamic";

function isBirthdayToday(birthDate: Date, now: Date): boolean {
  return birthDate.getUTCMonth() === now.getUTCMonth() && birthDate.getUTCDate() === now.getUTCDate();
}

/**
 * Vercel Cron hits this daily (see vercel.json). Sends a birthday email —
 * the in-app free-coffee claim (claimBirthdayReward) is unaffected, this
 * only nudges customers back into the app on their day. Guarded so a retry
 * or a second invocation the same day can't double-send.
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

  const candidates = await prisma.user.findMany({
    where: { role: "CUSTOMER", active: true, birthDate: { not: null } },
    select: { id: true, birthDate: true, firstName: true, favoriteDrink: true },
  });

  const birthdayUsers = candidates.filter((u) => u.birthDate && isBirthdayToday(u.birthDate, now));

  let sent = 0;
  for (const user of birthdayUsers) {
    const alreadySentToday = await prisma.notification.findFirst({
      where: { userId: user.id, type: "BIRTHDAY", createdAt: { gte: startOfToday } },
    });
    if (alreadySentToday) continue;

    await notify({
      userId: user.id,
      type: "BIRTHDAY",
      channel: "EMAIL",
      title: "¡Feliz cumpleaños! 🎂",
      body: `Tenés tu ${user.favoriteDrink ?? "bebida favorita"} gratis esperándote esta semana.`,
      metadata: { drink: user.favoriteDrink ?? "bebida favorita" },
    });
    sent++;
  }

  return NextResponse.json({ checked: candidates.length, matched: birthdayUsers.length, sent });
}
