import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPointsHistory } from "@/server/services/loyalty-service";
import { listActiveRewards } from "@/server/services/reward-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdjustPointsForm } from "@/components/employee/adjust-points-form";
import { GrantRewardForm } from "@/components/admin/grant-reward-form";
import { formatCurrency, formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Cliente" };

export default async function CustomerAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await prisma.customerProfile.findUnique({
    where: { id },
    include: { user: true, tier: true },
  });
  if (!profile) notFound();

  const [transactions, rewards, favoriteItem] = await Promise.all([
    getPointsHistory(profile.id, prisma, 30),
    listActiveRewards(),
    prisma.orderItem.groupBy({
      by: ["name"],
      where: { order: { customerProfileId: profile.id } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 1,
    }),
  ]);

  // Server Component rendered once per request — "current time" here is a
  // point-in-time snapshot for the response, not a value re-read across renders.
  // eslint-disable-next-line react-hooks/purity
  const requestTime = Date.now();
  const averageTicket = profile.totalOrders > 0 ? Number(profile.totalSpent) / profile.totalOrders : 0;
  const monthsActive = profile.firstOrderAt
    ? Math.max(1, (requestTime - profile.firstOrderAt.getTime()) / (30 * 24 * 60 * 60 * 1000))
    : 1;
  const frequency = profile.totalOrders / monthsActive;

  return (
    <div className="flex flex-col gap-5">
      <Card className="bg-cc-green-800 text-cc-cream-50">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div>
            <p className="font-heading text-xl font-semibold">
              {profile.user.firstName} {profile.user.lastName}
            </p>
            <p className="text-sm text-cc-gold-300">{profile.tier?.name ?? "Amigo Ciocolatto"}</p>
            <p className="text-xs text-cc-cream-200">{profile.user.email}</p>
          </div>
          <div className="flex items-center gap-1.5 text-2xl font-bold">
            <Star className="size-6 fill-cc-gold-400 text-cc-gold-400" />
            {profile.pointsBalance}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Compras" value={String(profile.totalOrders)} />
        <Metric label="Gastado" value={formatCurrency(Number(profile.totalSpent))} />
        <Metric label="Ticket promedio" value={formatCurrency(averageTicket)} />
        <Metric label="Frecuencia" value={`${frequency.toFixed(1)}/mes`} />
        <Metric label="Última visita" value={profile.lastOrderAt ? formatDateTime(profile.lastOrderAt) : "—"} />
        <Metric label="Producto favorito" value={favoriteItem[0]?.name ?? "—"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agregar / restar puntos</CardTitle>
          </CardHeader>
          <CardContent>
            <AdjustPointsForm customerProfileId={profile.id} allowNegative />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enviar beneficio</CardTitle>
          </CardHeader>
          <CardContent>
            <GrantRewardForm customerProfileId={profile.id} rewards={rewards} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos recientes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border p-0">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <p className="text-sm font-medium">{tx.description}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
              </div>
              <span
                className={`shrink-0 font-heading text-sm font-semibold tabular-nums ${
                  tx.amount >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {tx.amount >= 0 ? "+" : ""}
                {tx.amount}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin movimientos todavía.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-3.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate font-heading text-base font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
