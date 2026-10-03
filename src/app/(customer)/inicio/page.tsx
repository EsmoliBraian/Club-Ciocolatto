import type { Metadata } from "next";
import Link from "next/link";
import { Coffee, Megaphone, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import {
  getCustomerProfileByUserId,
  isBirthdayWindowActive,
  isAnniversaryWindowActive,
} from "@/server/services/customer-service";
import { listActiveTiersCached, getEffectiveTier } from "@/server/services/tier-service";
import { listRewardsForCustomer } from "@/server/services/reward-service";
import { getMissionsForCustomer, filterVisibleMissions } from "@/server/services/mission-service";
import { getSurveyStateForCustomer } from "@/server/services/survey-service";
import { countUnreadNotifications } from "@/server/services/notification-service";
import { listActivePromotionsForCustomer, listUpcomingPromotionsForCustomer } from "@/server/services/promotion-service";
import { NotificationsButton } from "@/components/customer/notifications-button";
import { BrandIcon } from "@/components/shared/brand-icon";
import { TierProgressCard } from "@/components/customer/tier-progress-card";
import { RedeemButton } from "@/components/customer/redeem-button";
import { BirthdayBanner } from "@/components/customer/birthday-banner";
import { AnniversaryBanner } from "@/components/customer/anniversary-banner";
import { SurveyCard } from "@/components/customer/survey-card";
import { MissionCard } from "@/components/customer/mission-card";
import { TierBadgeButton } from "@/components/customer/tier-badge-button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Inicio" };

export default async function CustomerHomePage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  // Independent reads — parallelized so the page waits on the slowest one,
  // not the sum of all three.
  const [tiers, rewards, rawMissions, surveyState, unreadCount, activePromos, upcomingPromos] = await Promise.all([
    listActiveTiersCached(),
    listRewardsForCustomer(profile.id),
    getMissionsForCustomer(profile.id),
    getSurveyStateForCustomer(profile.id),
    countUnreadNotifications(session!.user.id),
    listActivePromotionsForCustomer(),
    listUpcomingPromotionsForCustomer(),
  ]);
  const { progress } = await getEffectiveTier(profile, tiers);
  const missions = filterVisibleMissions(rawMissions);

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
  const showAnniversary =
    isAnniversaryWindowActive(profile.createdAt) &&
    profile.anniversaryRewardClaimedYear !== new Date().getFullYear();

  const initials = `${profile.user.firstName[0]}${profile.user.lastName[0] ?? ""}`.toUpperCase();

  // Active takes priority (it's actionable right now); otherwise tease the
  // soonest upcoming one. Hidden entirely when there's nothing to show —
  // no empty/irrelevant banner.
  const featuredPromo = activePromos[0] ?? upcomingPromos[0];
  const promoIsActive = !!activePromos[0];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Hola, {profile.user.firstName} 👋
          </h1>
          {profile.visitStreakWeeks > 1 && (
            <p className="text-xs font-medium text-cc-gold-400">🔥 {profile.visitStreakWeeks} semanas seguidas</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NotificationsButton unreadCount={unreadCount} />
          <Link href="/perfil">
            <Avatar className="size-10">
              {profile.user.avatarUrl && <AvatarImage src={profile.user.avatarUrl} alt="" />}
              <AvatarFallback className="bg-cc-gold-400 font-heading text-cc-green-900">{initials}</AvatarFallback>
            </Avatar>
          </Link>
          <TierBadgeButton
            icon={progress.currentTier?.icon ?? null}
            name={progress.currentTier?.name ?? "Amigo Ciocolatto"}
            color={progress.currentTier?.color ?? null}
            size="sm"
          />
        </div>
      </div>

      {showBirthday && <BirthdayBanner favoriteDrink={profile.user.favoriteDrink} />}
      {showAnniversary && <AnniversaryBanner />}

      <TierProgressCard pointsBalance={profile.pointsBalance} progress={progress} />

      <Link
        href="/perfil/acciones"
        className="flex items-center gap-3 rounded-2xl border border-cc-gold-400/40 bg-cc-gold-400/10 p-4 shadow-sm transition-colors hover:bg-cc-gold-400/15"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-cc-gold-400 text-cc-green-900">
          <Megaphone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading font-semibold text-foreground">Puntos Extra</p>
          <p className="text-sm text-muted-foreground">Sumá puntos por una reseña o publicación en redes.</p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
      </Link>

      {featuredPromo && (
        <Link
          href={featuredPromo.ctaUrl ?? "/promociones"}
          target={featuredPromo.ctaUrl ? "_blank" : undefined}
          rel={featuredPromo.ctaUrl ? "noopener noreferrer" : undefined}
          className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4 shadow-sm transition-colors hover:bg-primary/15"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <BrandIcon emoji={featuredPromo.icon ?? "🎉"} size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {promoIsActive ? "Promoción activa" : "Próximamente"}
            </p>
            <p className="truncate font-heading font-semibold text-foreground">{featuredPromo.name}</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </Link>
      )}

      {surveyState.question && !surveyState.alreadyAnswered && <SurveyCard question={surveyState.question} />}

      {nextBenefit && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Coffee className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Beneficio disponible
              </p>
              <p className="font-heading font-semibold text-foreground">{nextBenefit.reward.name}</p>
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
            <p className="font-heading font-semibold text-foreground">Misiones activas</p>
            <Link href="/misiones" className="text-xs font-medium text-primary hover:underline">
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
