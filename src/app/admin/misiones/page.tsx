import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MissionFormDialog } from "@/components/admin/mission-form-dialog";
import { ActiveToggle } from "@/components/admin/active-toggle";
import { toggleMissionActiveAction } from "@/actions/admin-actions";

export const metadata: Metadata = { title: "Misiones" };

export default async function MissionsAdminPage() {
  const [missions, products] = await Promise.all([
    prisma.mission.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { progress: true } } } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Misiones</h1>
        <MissionFormDialog products={products} />
      </div>

      <div className="flex flex-col gap-3">
        {missions.map((mission) => (
          <Card key={mission.id}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{mission.icon ?? "🎯"}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-heading font-semibold">{mission.name}</p>
                    <Badge variant="secondary">{mission._count.progress} en progreso/completadas</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {mission.description} · Objetivo: {mission.targetValue} · +{mission.rewardPoints} pts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ActiveToggle id={mission.id} active={mission.active} onToggle={toggleMissionActiveAction} />
                <MissionFormDialog mission={mission} products={products} />
              </div>
            </CardContent>
          </Card>
        ))}
        {missions.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Todavía no creaste misiones.</p>
        )}
      </div>
    </div>
  );
}
