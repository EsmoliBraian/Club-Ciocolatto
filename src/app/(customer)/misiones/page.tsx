import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, QrCode } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { getMissionsForCustomer, filterVisibleMissions } from "@/server/services/mission-service";
import { MissionCard } from "@/components/customer/mission-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Misiones" };

export default async function MissionsPage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  const missions = filterVisibleMissions(await getMissionsForCustomer(profile.id));

  const all = missions.map((m) => ({
    mission: m.mission,
    currentValue: m.currentValue,
    completed: m.status === "COMPLETED" || m.status === "REWARD_CLAIMED",
  }));

  const active = all.filter((m) => !m.completed);
  const completed = all.filter((m) => m.completed);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <h1 className="font-heading text-xl font-semibold text-foreground">Misiones</h1>

      <Link
        href="/qr"
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-secondary/50"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
          <QrCode className="size-5" />
        </span>
        <p className="text-sm text-foreground">
          <span className="font-semibold">La forma más simple de sumar puntos:</span> mostrá tu QR en el local cada vez
          que hacés una compra. Sumás puntos por lo que gastás, además de lo que ganes en misiones.
        </p>
      </Link>

      {all.length === 0 ? (
        <EmptyState />
      ) : (
        <Tabs defaultValue="activas">
          <TabsList>
            <TabsTrigger value="activas">Activas</TabsTrigger>
            <TabsTrigger value="completadas">Completadas</TabsTrigger>
          </TabsList>
          <TabsContent value="activas" className="mt-3 flex flex-col gap-2.5">
            {active.length === 0 ? (
              <EmptyState label="No tenés misiones activas ahora." />
            ) : (
              active.map((m, i) => (
                <MissionCard
                  key={m.mission.id}
                  icon={m.mission.icon}
                  title={m.mission.name}
                  description={m.mission.description}
                  current={m.currentValue}
                  target={m.mission.targetValue}
                  rewardPoints={m.mission.rewardPoints}
                  completed={false}
                  colorIndex={i}
                />
              ))
            )}
          </TabsContent>
          <TabsContent value="completadas" className="mt-3 flex flex-col gap-2.5">
            {completed.length === 0 ? (
              <EmptyState label="Todavía no completaste misiones." />
            ) : (
              completed.map((m, i) => (
                <MissionCard
                  key={m.mission.id}
                  icon={m.mission.icon}
                  title={m.mission.name}
                  description={m.mission.description}
                  current={m.currentValue}
                  target={m.mission.targetValue}
                  rewardPoints={m.mission.rewardPoints}
                  completed
                  colorIndex={i}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function EmptyState({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-12 text-center">
      <Trophy className="size-8 text-muted-foreground" />
      <p className="font-medium text-foreground">{label ?? "Todavía no tenés misiones activas."}</p>
      {!label && <p className="text-sm text-muted-foreground">Volvé pronto. ☕</p>}
    </div>
  );
}
