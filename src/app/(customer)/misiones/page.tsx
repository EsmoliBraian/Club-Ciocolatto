import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { getMissionsForCustomer } from "@/server/services/mission-service";
import { getReferralStats } from "@/server/services/referral-service";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Misiones" };

export default async function MissionsPage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  const missions = await getMissionsForCustomer(profile.id);
  const referralStats = await getReferralStats(profile.id);

  const orderDriven = missions.filter((m) => m.mission.type !== "REFERRAL");
  const referralMission = missions.find((m) => m.mission.type === "REFERRAL");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <h1 className="font-heading text-2xl font-semibold">Misiones</h1>

      {orderDriven.length === 0 && !referralMission ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Trophy className="size-8 text-muted-foreground" />
            <p className="font-medium">Todavía no tenés misiones activas.</p>
            <p className="text-sm text-muted-foreground">Volvé pronto. ☕</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {referralMission && (
            <MissionCard
              icon={referralMission.mission.icon}
              title={referralMission.mission.name}
              description={referralMission.mission.description}
              current={Math.min(referralStats.completed, referralMission.mission.targetValue)}
              target={referralMission.mission.targetValue}
              rewardPoints={referralMission.mission.rewardPoints}
              completed={referralStats.completed >= referralMission.mission.targetValue}
            />
          )}
          {orderDriven.map((m) => (
            <MissionCard
              key={m.mission.id}
              icon={m.mission.icon}
              title={m.mission.name}
              description={m.mission.description}
              current={m.currentValue}
              target={m.mission.targetValue}
              rewardPoints={m.mission.rewardPoints}
              completed={m.status === "COMPLETED" || m.status === "REWARD_CLAIMED"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MissionCard({
  icon,
  title,
  description,
  current,
  target,
  rewardPoints,
  completed,
}: {
  icon: string | null;
  title: string;
  description: string;
  current: number;
  target: number;
  rewardPoints: number;
  completed: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon ?? "🎯"}</span>
            <div>
              <p className="font-medium leading-tight">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {completed && <Badge className="bg-cc-gold-400 text-cc-green-900">Completada</Badge>}
        </div>
        <div className="flex items-center gap-3">
          <Progress value={(current / target) * 100} className="h-2 flex-1" />
          <span className="text-sm font-medium tabular-nums text-muted-foreground">
            {current}/{target}
          </span>
        </div>
        <p className="text-sm font-semibold text-primary">+{rewardPoints} puntos</p>
      </CardContent>
    </Card>
  );
}
