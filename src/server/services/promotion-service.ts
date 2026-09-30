import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";

export async function listActivePromotionsForCustomer(db: Db = prisma) {
  const now = new Date();
  return db.promotion.findMany({
    where: { active: true, startAt: { lte: now }, endAt: { gte: now } },
    include: { product: true },
    orderBy: { endAt: "asc" },
  });
}

/** Promotions that haven't started yet — for teasing "coming soon" on the home page. */
export async function listUpcomingPromotionsForCustomer(db: Db = prisma) {
  const now = new Date();
  return db.promotion.findMany({
    where: { active: true, startAt: { gt: now } },
    include: { product: true },
    orderBy: { startAt: "asc" },
  });
}
