import type { Metadata } from "next";
import { Lock, Check } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { listActiveTiersCached, calculateTierProgress } from "@/server/services/tier-service";
import { BackHeader } from "@/components/shared/back-header";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export const metadata: Metadata = { title: "Mi camino" };

export default async function TierPathPage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  const tiers = await listActiveTiersCached();
  const progress = calculateTierProgress(profile.lifetimePoints, tiers);
  const initials = `${profile.user.firstName[0]}${profile.user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 pt-6 pb-4">
      <BackHeader title="Mi camino en Club Ciocolatto" />

      <p className="text-sm text-muted-foreground">
        Cada punto cuenta, cada nivel te hace único. Llevás{" "}
        <span className="font-semibold text-foreground">{profile.lifetimePoints} puntos</span> acumulados.
      </p>

      <div className="flex flex-col gap-3">
        {tiers.map((tier) => {
          const isCurrent = progress.currentTier?.id === tier.id;
          const isAchieved = profile.lifetimePoints >= tier.minimumPoints;
          const tint = tier.color ?? "#1C4328";
          const rangeLabel = tier.maximumPoints
            ? `${tier.minimumPoints.toLocaleString("es-AR")}–${tier.maximumPoints.toLocaleString("es-AR")} pts`
            : `${tier.minimumPoints.toLocaleString("es-AR")}+ pts`;

          return (
            <div
              key={tier.id}
              className="flex items-center gap-3 rounded-2xl border p-3.5 transition-colors"
              style={{
                borderColor: isCurrent ? tint : "var(--border)",
                backgroundColor: isCurrent ? `${tint}14` : "var(--card)",
              }}
            >
              {isCurrent ? (
                <Avatar className="size-14 shrink-0" style={{ boxShadow: `0 0 0 3px ${tint}` }}>
                  {profile.user.avatarUrl && <AvatarImage src={profile.user.avatarUrl} alt="" />}
                  <AvatarFallback className="bg-cc-gold-400 font-heading text-lg text-cc-green-900">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <span
                  className="flex size-14 shrink-0 items-center justify-center rounded-full text-2xl"
                  style={{
                    backgroundColor: isAchieved ? `${tint}1a` : "var(--muted)",
                    opacity: isAchieved ? 1 : 0.55,
                  }}
                >
                  {tier.icon ?? "🏅"}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className={`truncate font-heading font-semibold ${isAchieved ? "text-foreground" : "text-muted-foreground"}`}>
                    {tier.name}
                  </p>
                  {isAchieved && !isCurrent && <Check className="size-3.5 shrink-0 text-primary" />}
                  {!isAchieved && <Lock className="size-3 shrink-0 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground">{tier.description}</p>
                <p className="mt-0.5 text-xs font-medium tabular-nums" style={{ color: isAchieved ? tint : undefined }}>
                  {rangeLabel}
                  {isCurrent && progress.pointsToNextTier !== null && (
                    <span className="text-muted-foreground"> · te faltan {progress.pointsToNextTier} para el próximo</span>
                  )}
                  {isCurrent && progress.pointsToNextTier === null && (
                    <span className="text-muted-foreground"> · estás en el nivel más alto 🎉</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="rounded-xl bg-secondary px-3.5 py-2.5 text-center text-xs text-muted-foreground">
        Más beneficios exclusivos, experiencias únicas y atención preferencial en cada nivel.
      </p>
    </div>
  );
}
