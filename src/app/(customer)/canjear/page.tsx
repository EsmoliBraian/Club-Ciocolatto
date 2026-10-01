import type { Metadata } from "next";
import { Gift, Star, Lock } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { listRewardsForCustomer, type RewardEligibility } from "@/server/services/reward-service";
import { formatDate } from "@/lib/format";
import { BrandIcon } from "@/components/shared/brand-icon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RedeemButton } from "@/components/customer/redeem-button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Canjear" };

const REASON_LABEL: Record<string, string> = {
  INSUFFICIENT_POINTS: "Te faltan puntos",
  OUT_OF_STOCK: "Agotado",
  TIER_REQUIRED: "Requiere más nivel",
  LIMIT_REACHED: "Límite alcanzado",
  COOLDOWN_ACTIVE: "Ya lo canjeaste",
  VISITS_REQUIRED: "Te faltan visitas",
};

export default async function RedeemPage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  const rewards = await listRewardsForCustomer(profile.id);
  const products = rewards.filter((r) => r.reward.category === "PRODUCT");
  const discounts = rewards.filter((r) => r.reward.category === "DISCOUNT");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold text-foreground">Canjear puntos</h1>
        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary">
          <Star className="size-3.5 fill-cc-gold-400 text-cc-gold-400" />
          {profile.pointsBalance} pts
        </div>
      </div>

      {rewards.length === 0 ? (
        <EmptyState />
      ) : (
        <Tabs defaultValue="todos">
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="descuentos">Descuentos</TabsTrigger>
          </TabsList>
          <TabsContent value="todos" className="mt-3">
            <RewardGrid items={rewards} pointsBalance={profile.pointsBalance} />
          </TabsContent>
          <TabsContent value="productos" className="mt-3">
            <RewardGrid items={products} pointsBalance={profile.pointsBalance} />
          </TabsContent>
          <TabsContent value="descuentos" className="mt-3">
            <RewardGrid items={discounts} pointsBalance={profile.pointsBalance} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function RewardGrid({ items, pointsBalance }: { items: RewardEligibility[]; pointsBalance: number }) {
  if (items.length === 0) {
    return <EmptyState label="Nada por acá todavía." />;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ reward, eligible, reason, availableAgainAt, visitsSoFar }) => (
        <div
          key={reward.id}
          className={cn(
            "flex flex-col gap-2 rounded-2xl border border-border bg-card p-3.5 shadow-sm",
            reason === "VISITS_REQUIRED" && "opacity-70"
          )}
        >
          <BrandIcon emoji={reward.icon ?? "🎁"} size={28} className="text-foreground" />
          <div className="min-h-8">
            <p className="font-medium leading-tight text-foreground">{reward.name}</p>
            {reward.category === "PRODUCT" && (
              <p className="text-xs font-semibold text-cc-gold-400">GRATIS</p>
            )}
          </div>
          <p className="text-xs font-semibold text-muted-foreground">{reward.pointsCost} pts</p>
          {reason === "VISITS_REQUIRED" && reward.minimumVisits != null && (
            <div className="flex flex-col gap-1">
              <Progress value={((visitsSoFar ?? 0) / reward.minimumVisits) * 100} />
              <p className="text-[11px] text-muted-foreground">
                Se desbloquea con {reward.minimumVisits} visitas. Llevás {visitsSoFar ?? 0} de {reward.minimumVisits}.
              </p>
            </div>
          )}
          {eligible ? (
            <RedeemButton
              rewardId={reward.id}
              rewardName={reward.name}
              pointsCost={reward.pointsCost}
              pointsBalance={pointsBalance}
              size="sm"
            />
          ) : (
            <Button size="sm" variant="outline" disabled className="text-muted-foreground opacity-70">
              <Lock className="size-3" />
              {reason === "COOLDOWN_ACTIVE" && availableAgainAt
                ? `Disponible el ${formatDate(availableAgainAt)}`
                : reason
                  ? (REASON_LABEL[reason] ?? "No disponible")
                  : "No disponible"}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-12 text-center">
      <Gift className="size-8 text-muted-foreground" />
      <p className="font-medium text-foreground">
        {label ?? "Seguí sumando puntos para desbloquear nuevos beneficios."}
      </p>
    </div>
  );
}
