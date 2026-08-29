import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import type { NotificationChannel, NotificationType, Prisma } from "@prisma/client";
import { sendEmail, birthdayEmailHtml, genericEmailHtml } from "@/lib/email";

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  channel?: NotificationChannel;
  metadata?: Prisma.InputJsonValue;
}

/** Channel dispatchers beyond IN_APP (which is always persisted to the DB and
 * read by the customer's notification bell). Register a provider here to add
 * WhatsApp/push without touching call sites. */
export const channelDispatchers: Partial<
  Record<NotificationChannel, (input: NotifyInput) => Promise<void>>
> = {
  EMAIL: async (input) => {
    const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { email: true, firstName: true } });
    if (!user) return;

    const metadata = (input.metadata ?? {}) as Record<string, unknown>;
    const html =
      input.type === "BIRTHDAY"
        ? birthdayEmailHtml({
            firstName: user.firstName,
            drink: typeof metadata.drink === "string" ? metadata.drink : "bebida favorita",
            appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://club-ciocolatto.vercel.app",
          })
        : genericEmailHtml(input.title, input.body);

    await sendEmail({ to: user.email, subject: input.title, html });
  },
};

export async function notify(input: NotifyInput, db: Db = prisma) {
  const notification = await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      channel: input.channel ?? "IN_APP",
      title: input.title,
      body: input.body,
      metadata: input.metadata,
    },
  });

  const dispatch = input.channel ? channelDispatchers[input.channel] : undefined;
  if (dispatch) {
    // Fire-and-forget: notification delivery must never fail the calling transaction.
    void dispatch(input).catch((err) => {
      console.error(`[notification-service] dispatch failed for channel ${input.channel}`, err);
    });
  }

  return notification;
}

export async function listRecentNotifications(userId: string, limit = 50, db: Db = prisma) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
