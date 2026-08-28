import type { Metadata } from "next";
import Link from "next/link";
import { Gift, Flame } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId, isBirthdayWindowActive } from "@/server/services/customer-service";
import { listActiveTiersCached } from "@/server/services/tier-service";
import { calculateTierProgress } from "@/server/services/tier-service";
import { listRewardsForCustomer } from "@/server/services/reward-service";
import { getMissionsForCustomer } from "@/server/services/mission-service";
import { TierProgressCard } from "@/components/customer/tier-progress-card";
import { RedeemButton } from "@/components/customer/redeem-button";
import { BirthdayBanner } from "@/components/customer/birthday-banner";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Inicio" };

export default async function CustomerHomePage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  const tiers = await listActiveTiersCached();
  const progress = calculateTierProgress(profile.lifetimePoints, tiers);
  const rewards = await listRewardsForCustomer(profile.id);
  const missions = await getMissionsForCustomer(profile.id);

  const nextBenefit =
    rewards.find((r) => !r.eligible && r.reason === "INSUFFICIENT_POINTS") ??
    rewards.find((r) => r.eligible) ??
    rewards[0];

  const activeMission = [...missions]
    .filter((m) => m.status === "IN_PROGRESS")
    .sort((a, b) => b.currentValue / b.mission.targetValue - a.currentValue / a.mission.targetValue)[0];

  const showBirthday =
    isBirthdayWindowActive(profile.user.birthDate) &&
    profile.birthdayRewardClaimedYear !== new Date().getFullYear();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 pt-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Hola, {profile.user.firstName} 👋</h1>
      </div>

      {showBirthday && <BirthdayBanner />}

      <TierProgressCard pointsBalance={profile.pointsBalance} progress={progress} />

      {nextBenefit && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Gift className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Tu próximo beneficio
                </p>
                <p className="font-medium">{nextBenefit.reward.name}</p>
                <p className="text-sm text-cc-gold-400 font-semibold">{nextBenefit.reward.pointsCost} puntos</p>
              </div>
            </div>
            {nextBenefit.eligible ? (
              <RedeemButton
                rewardId={nextBenefit.reward.id}
                rewardName={nextBenefit.reward.name}
                pointsCost={nextBenefit.reward.pointsCost}
                pointsBalance={profile.pointsBalance}
                size="sm"
              />
            ) : (
              <Button size="sm" variant="outline" disabled>
                Canjear
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {activeMission && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-cc-gold-400" />
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Misión activa
              </p>
            </div>
            <div>
              <p className="font-medium">{activeMission.mission.description}</p>
              <div className="mt-2 flex items-center gap-3">
                <Progress
                  value={(activeMission.currentValue / activeMission.mission.targetValue) * 100}
                  className="h-2 flex-1"
                />
                <span className="text-sm font-medium tabular-nums text-muted-foreground">
                  {activeMission.currentValue}/{activeMission.mission.targetValue}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-primary">
                +{activeMission.mission.rewardPoints} puntos
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Link
        href="/misiones"
        className="text-center text-sm font-medium text-primary hover:underline"
      >
        Ver todas mis misiones y beneficios →
      </Link>
    </div>
  );
}
