import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import { sendPushNotification, type PushSubscriptionInput } from "@/lib/push";

export async function subscribeToPush(userId: string, subscription: PushSubscriptionInput) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function unsubscribeFromPush(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function hasPushEnabled(userId: string, db: Db = prisma): Promise<boolean> {
  const count = await db.pushSubscription.count({ where: { userId } });
  return count > 0;
}

/**
 * Fans a notification out to every device the user subscribed on. Best-effort
 * and silent — a push failure must never affect the caller (the in-app
 * Notification row is already written by the time this runs). Cleans up
 * subscriptions the push service reports as expired.
 */
export async function pushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
  db: Db = prisma
): Promise<void> {
  const subscriptions = await db.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  for (const sub of subscriptions) {
    const result = await sendPushNotification(sub, payload);
    if (result.expired) {
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
    }
  }
}
