import { prisma } from "@/lib/prisma";

const ACTIVE_WINDOW_DAYS = 30;

/**
 * Dashboard KPIs. Formulas documented in docs/loyalty-system.md:
 * - "activo" = at least one order in the last 30 days.
 * - ticketPromedio = avg(Order.totalAmount) over completed orders.
 * - frecuenciaPromedio = avg(totalOrders / monthsSinceFirstOrder) across customers with >=1 order.
 * - pointsLiability = sum of current spendable balances (outstanding points owed).
 * - redemptionRate = points redeemed / points earned (lifetime).
 */
export async function getDashboardStats() {
  const activeSince = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [
    totalCustomers,
    activeCustomers,
    pointsAwardedAgg,
    pointsRedeemedAgg,
    redemptionsCount,
    ordersAgg,
    balanceAgg,
    customersWithOrders,
  ] = await Promise.all([
    prisma.customerProfile.count(),
    prisma.customerProfile.count({ where: { lastOrderAt: { gte: activeSince } } }),
    prisma.pointTransaction.aggregate({
      where: { type: { in: ["EARN", "BONUS", "REFUND"] } },
      _sum: { amount: true },
    }),
    prisma.pointTransaction.aggregate({ where: { type: "REDEEM" }, _sum: { amount: true } }),
    prisma.rewardRedemption.count(),
    prisma.order.aggregate({ where: { status: "COMPLETED" }, _avg: { totalAmount: true }, _count: true }),
    prisma.customerProfile.aggregate({ _sum: { pointsBalance: true } }),
    prisma.customerProfile.findMany({
      where: { totalOrders: { gt: 0 } },
      select: { totalOrders: true, firstOrderAt: true },
    }),
  ]);

  const pointsAwarded = pointsAwardedAgg._sum.amount ?? 0;
  const pointsRedeemed = Math.abs(pointsRedeemedAgg._sum.amount ?? 0);

  const frequencies = customersWithOrders.map((c) => {
    const months = c.firstOrderAt
      ? Math.max(1, (Date.now() - c.firstOrderAt.getTime()) / (30 * 24 * 60 * 60 * 1000))
      : 1;
    return c.totalOrders / months;
  });
  const avgFrequency = frequencies.length
    ? frequencies.reduce((a, b) => a + b, 0) / frequencies.length
    : 0;

  return {
    totalCustomers,
    activeCustomers,
    pointsAwarded,
    pointsRedeemed,
    redemptionsCount,
    averageOrderValue: Number(ordersAgg._avg.totalAmount ?? 0),
    totalOrders: ordersAgg._count,
    averageVisitFrequency: avgFrequency,
    pointsLiability: balanceAgg._sum.pointsBalance ?? 0,
    redemptionRate: pointsAwarded > 0 ? pointsRedeemed / pointsAwarded : 0,
  };
}

export async function getNewCustomersSeries(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const profiles = await prisma.customerProfile.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });
  return bucketByDay(profiles.map((p) => p.createdAt), days);
}

export async function getPointsActivitySeries(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const transactions = await prisma.pointTransaction.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, amount: true, type: true },
  });

  const buckets = new Map<string, { date: string; earned: number; redeemed: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: key, earned: 0, redeemed: 0 });
  }
  for (const tx of transactions) {
    const key = tx.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (tx.amount > 0) bucket.earned += tx.amount;
    else bucket.redeemed += Math.abs(tx.amount);
  }
  return Array.from(buckets.values());
}

export async function getCustomersByTier() {
  const tiers = await prisma.loyaltyTier.findMany({
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { customers: true } } },
  });
  return tiers.map((t) => ({ name: t.name, value: t._count.customers, color: t.color ?? "#1c4328" }));
}

export async function getTopRedeemedRewards(limit = 5) {
  const grouped = await prisma.rewardRedemption.groupBy({
    by: ["rewardId"],
    _count: { _all: true },
    orderBy: { _count: { rewardId: "desc" } },
    take: limit,
  });
  const rewards = await prisma.reward.findMany({ where: { id: { in: grouped.map((g) => g.rewardId) } } });
  return grouped.map((g) => ({
    name: rewards.find((r) => r.id === g.rewardId)?.name ?? "—",
    count: g._count._all,
  }));
}

export async function getTopCompletedMissions(limit = 5) {
  const grouped = await prisma.missionProgress.groupBy({
    by: ["missionId"],
    where: { status: { in: ["COMPLETED", "REWARD_CLAIMED"] } },
    _count: { _all: true },
    orderBy: { _count: { missionId: "desc" } },
    take: limit,
  });
  const missions = await prisma.mission.findMany({ where: { id: { in: grouped.map((g) => g.missionId) } } });
  return grouped.map((g) => ({
    name: missions.find((m) => m.id === g.missionId)?.name ?? "—",
    count: g._count._all,
  }));
}

export async function getRecentRedemptions(limit = 6) {
  const redemptions = await prisma.rewardRedemption.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { reward: true, customerProfile: { include: { user: true } } },
  });
  return redemptions.map((r) => ({
    id: r.id,
    customerName: `${r.customerProfile.user.firstName} ${r.customerProfile.user.lastName}`,
    rewardName: r.reward.name,
    pointsSpent: r.pointsSpent,
    status: r.status,
    createdAt: r.createdAt,
  }));
}

function bucketByDay(dates: Date[], days: number) {
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const date of dates) {
    const key = date.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}
