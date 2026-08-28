import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import type { NotificationChannel, NotificationType, Prisma } from "@prisma/client";

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  channel?: NotificationChannel;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Channel dispatchers beyond IN_APP (which is always persisted to the DB and
 * read by the customer's notification bell). Register a provider here to add
 * email/WhatsApp/push without touching call sites — e.g.
 * `channelDispatchers.EMAIL = (n) => resend.emails.send(...)`.
 * Left empty by default: no external provider is wired up yet.
 */
export const channelDispatchers: Partial<
  Record<NotificationChannel, (input: NotifyInput) => Promise<void>>
> = {};

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
