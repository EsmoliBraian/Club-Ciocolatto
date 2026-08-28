import type { Metadata } from "next";
import Link from "next/link";
import { Coffee } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId, isBirthdayWindowActive } from "@/server/services/customer-service";
import { listActiveTiersCached, calculateTierProgress } from "@/server/services/tier-service";
import { listRewardsForCustomer } from "@/server/services/reward-service";
import { getMissionsForCustomer } from "@/server/services/mission-service";
import { TierProgressCard } from "@/components/customer/tier-progress-card";
import { RedeemButton } from "@/components/customer/redeem-button";
import { BirthdayBanner } from "@/components/customer/birthday-banner";
import { MissionCard } from "@/components/customer/mission-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

  const activeMissions = [...missions]
    .filter((m) => m.status === "IN_PROGRESS")
    .sort((a, b) => b.currentValue / b.mission.targetValue - a.currentValue / a.mission.targetValue)
    .slice(0, 2);

  const showBirthday =
    isBirthdayWindowActive(profile.user.birthDate) &&
    profile.birthdayRewardClaimedYear !== new Date().getFullYear();

  const initials = `${profile.user.firstName[0]}${profile.user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold text-cc-cream-50">
          Hola, {profile.user.firstName} 👋
        </h1>
        <Avatar className="size-10">
          <AvatarFallback className="bg-cc-gold-400 font-heading text-cc-green-900">{initials}</AvatarFallback>
        </Avatar>
      </div>

      {showBirthday && <BirthdayBanner favoriteDrink={profile.user.favoriteDrink} />}

      <TierProgressCard pointsBalance={profile.pointsBalance} progress={progress} />

      {nextBenefit && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-cc-cream-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Coffee className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Beneficio disponible
              </p>
              <p className="font-heading font-semibold text-cc-green-900">{nextBenefit.reward.name}</p>
              <p className="text-xs font-semibold text-cc-gold-400">
                {nextBenefit.eligible ? "GRATIS" : `${nextBenefit.reward.pointsCost} pts`}
              </p>
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
        </div>
      )}

      {activeMissions.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <p className="font-heading font-semibold text-cc-cream-50">Misiones activas</p>
            <Link href="/misiones" className="text-xs font-medium text-cc-gold-300 hover:underline">
              Ver todas
            </Link>
          </div>
          {activeMissions.map((m, i) => (
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
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}
