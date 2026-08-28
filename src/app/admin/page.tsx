import type { Metadata } from "next";
import { Users, UserCheck, Star, TicketCheck } from "lucide-react";
import {
  getDashboardStats,
  getNewCustomersSeries,
  getPointsActivitySeries,
  getCustomersByTier,
  getTopRedeemedRewards,
  getTopCompletedMissions,
  getRecentRedemptions,
} from "@/server/services/analytics-service";
import { StatTile } from "@/components/admin/stat-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankedBarList } from "@/components/admin/ranked-bar-list";
import { PointsActivityChart } from "@/components/admin/charts/points-activity-chart";
import { NewCustomersChart } from "@/components/admin/charts/new-customers-chart";
import { TierDonutChart } from "@/components/admin/charts/tier-donut-chart";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dashboard" };

const REDEMPTION_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  PENDING: { label: "Pendiente", variant: "default" },
  USED: { label: "Completado", variant: "secondary" },
  EXPIRED: { label: "Vencido", variant: "destructive" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
};

export default async function AdminDashboardPage() {
  const [stats, newCustomers, pointsActivity, byTier, topRewards, topMissions, recentRedemptions] =
    await Promise.all([
      getDashboardStats(),
      getNewCustomersSeries(30),
      getPointsActivitySeries(30),
      getCustomersByTier(),
      getTopRedeemedRewards(),
      getTopCompletedMissions(),
      getRecentRedemptions(),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen general del programa de membresía.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Clientes totales" value={stats.totalCustomers.toLocaleString("es-AR")} icon={Users} />
        <StatTile
          label="Clientes activos"
          value={stats.activeCustomers.toLocaleString("es-AR")}
          icon={UserCheck}
          hint="Últimos 30 días"
        />
        <StatTile label="Puntos otorgados" value={stats.pointsAwarded.toLocaleString("es-AR")} icon={Star} />
        <StatTile label="Canjes realizados" value={stats.redemptionsCount.toLocaleString("es-AR")} icon={TicketCheck} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actividad de puntos (30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <PointsActivityChart data={pointsActivity} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Clientes por nivel</CardTitle>
            </CardHeader>
            <CardContent>
              <TierDonutChart data={byTier} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Canjes recientes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border p-0">
            {recentRedemptions.map((r) => {
              const status = REDEMPTION_LABEL[r.status];
              return (
                <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{r.customerName}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.rewardName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </div>
              );
            })}
            {recentRedemptions.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay canjes.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Premios más canjeados</CardTitle>
            </CardHeader>
            <CardContent>
              <RankedBarList items={topRewards.map((r) => ({ name: r.name, value: r.count }))} color="var(--cc-gold-400)" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Misiones más completadas</CardTitle>
            </CardHeader>
            <CardContent>
              <RankedBarList items={topMissions.map((m) => ({ name: m.name, value: m.count }))} color="var(--cc-green-600)" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes nuevos (30 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <NewCustomersChart data={newCustomers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fidelización</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Metric label="Ticket promedio" value={formatCurrency(stats.averageOrderValue)} />
          <Metric label="Frecuencia promedio" value={`${stats.averageVisitFrequency.toFixed(1)}/mes`} />
          <Metric label="Puntos canjeados" value={stats.pointsRedeemed.toLocaleString("es-AR")} />
          <Metric label="Ratio de canje" value={`${(stats.redemptionRate * 100).toFixed(1)}%`} />
          <Metric label="Puntos por cobrar" value={stats.pointsLiability.toLocaleString("es-AR")} />
          <Metric label="Órdenes totales" value={stats.totalOrders.toLocaleString("es-AR")} />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-heading text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
