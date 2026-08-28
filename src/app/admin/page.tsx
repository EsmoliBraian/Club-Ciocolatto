import type { Metadata } from "next";
import { Users, UserCheck, Star, TicketCheck } from "lucide-react";
import {
  getDashboardStats,
  getNewCustomersSeries,
  getPointsActivitySeries,
  getCustomersByTier,
  getTopRedeemedRewards,
  getTopCompletedMissions,
} from "@/server/services/analytics-service";
import { StatTile } from "@/components/admin/stat-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankedBarList } from "@/components/admin/ranked-bar-list";
import { PointsActivityChart } from "@/components/admin/charts/points-activity-chart";
import { NewCustomersChart } from "@/components/admin/charts/new-customers-chart";
import { TierDonutChart } from "@/components/admin/charts/tier-donut-chart";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [stats, newCustomers, pointsActivity, byTier, topRewards, topMissions] = await Promise.all([
    getDashboardStats(),
    getNewCustomersSeries(30),
    getPointsActivitySeries(30),
    getCustomersByTier(),
    getTopRedeemedRewards(),
    getTopCompletedMissions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad de puntos (30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <PointsActivityChart data={pointsActivity} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Clientes por nivel</CardTitle>
          </CardHeader>
          <CardContent>
            <TierDonutChart data={byTier} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Canjes más populares</CardTitle>
          </CardHeader>
          <CardContent>
            <RankedBarList items={topRewards.map((r) => ({ name: r.name, value: r.count }))} color="#eda100" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Misiones más completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <RankedBarList items={topMissions.map((m) => ({ name: m.name, value: m.count }))} color="#1baf7a" />
          </CardContent>
        </Card>
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
