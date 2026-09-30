import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import type { NotificationChannel, NotificationType, Prisma } from "@prisma/client";
import {
  sendEmail,
  birthdayEmailHtml,
  anniversaryEmailHtml,
  winbackEmailHtml,
  pointsExpiringEmailHtml,
  genericEmailHtml,
} from "@/lib/email";
import { pushToUser } from "@/server/services/push-service";

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://club-ciocolatto.vercel.app";
    const html =
      input.type === "BIRTHDAY"
        ? birthdayEmailHtml({
            firstName: user.firstName,
            drink: typeof metadata.drink === "string" ? metadata.drink : "bebida favorita",
            appUrl,
          })
        : input.type === "ANNIVERSARY"
          ? anniversaryEmailHtml({ appUrl })
          : input.type === "WINBACK"
            ? winbackEmailHtml({ firstName: user.firstName, appUrl })
            : input.type === "POINTS_EXPIRING"
              ? pointsExpiringEmailHtml({ firstName: user.firstName, appUrl })
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

  // Push is a cross-cutting add-on, independent of `channel` — a customer who
  // opted in gets a push for every notification type, on top of whichever
  // primary channel (email or none) already fired above. Fire-and-forget,
  // same reasoning as the dispatcher above.
  void pushToUser(input.userId, { title: input.title, body: input.body, url: "/actividad" }, db).catch((err) => {
    console.error("[notification-service] push fan-out failed", err);
  });

  return notification;
}

/** Broadcasts a message to every customer, or just those in one tier. Writes
 * one Notification row per recipient (so it shows up in their activity feed
 * like anything else) and fans out push the same way `notify()` does. */
export async function sendAnnouncement(
  params: { title: string; body: string; tierId?: string | null },
  db: Db = prisma
): Promise<{ recipientCount: number }> {
  const recipients = await db.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(params.tierId ? { customerProfile: { tierId: params.tierId } } : {}),
    },
    select: { id: true },
  });
  if (recipients.length === 0) return { recipientCount: 0 };

  await db.notification.createMany({
    data: recipients.map((r) => ({
      userId: r.id,
      type: "ANNOUNCEMENT" as const,
      channel: "IN_APP" as const,
      title: params.title,
      body: params.body,
    })),
  });

  await Promise.all(
    recipients.map((r) => pushToUser(r.id, { title: params.title, body: params.body, url: "/actividad" }, db))
  );

  return { recipientCount: recipients.length };
}

export async function listRecentNotifications(userId: string, limit = 50, db: Db = prisma) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function countUnreadNotifications(userId: string, db: Db = prisma): Promise<number> {
  return db.notification.count({ where: { userId, read: false } });
}

export async function markAllNotificationsRead(userId: string, db: Db = prisma): Promise<void> {
  await db.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}
