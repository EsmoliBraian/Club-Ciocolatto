import type { Metadata } from "next";
import { Gift, Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { listRewardsForCustomer, type RewardEligibility } from "@/server/services/reward-service";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RedeemButton } from "@/components/customer/redeem-button";

export const metadata: Metadata = { title: "Canjear" };

const REASON_LABEL: Record<string, string> = {
  INSUFFICIENT_POINTS: "Te faltan puntos",
  OUT_OF_STOCK: "Agotado",
  TIER_REQUIRED: "Requiere más nivel",
  LIMIT_REACHED: "Límite alcanzado",
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
        <h1 className="font-heading text-xl font-semibold text-cc-cream-50">Canjear puntos</h1>
        <div className="flex items-center gap-1.5 rounded-full bg-cc-cream-50/10 px-3 py-1 text-sm font-semibold text-cc-gold-300">
          <Star className="size-3.5 fill-cc-gold-400 text-cc-gold-400" />
          {profile.pointsBalance} pts
        </div>
      </div>

      {rewards.length === 0 ? (
        <EmptyState />
      ) : (
        <Tabs defaultValue="todos">
          <TabsList className="bg-cc-cream-50/10">
            <TabsTrigger value="todos" className="data-active:bg-cc-cream-50">
              Todos
            </TabsTrigger>
            <TabsTrigger value="productos" className="data-active:bg-cc-cream-50">
              Productos
            </TabsTrigger>
            <TabsTrigger value="descuentos" className="data-active:bg-cc-cream-50">
              Descuentos
            </TabsTrigger>
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
      {items.map(({ reward, eligible, reason }) => (
        <div
          key={reward.id}
          className={`flex flex-col gap-2 rounded-2xl bg-cc-cream-50 p-3.5 shadow-sm ${!eligible ? "opacity-60" : ""}`}
        >
          <span className="text-2xl">{reward.icon ?? "🎁"}</span>
          <div className="min-h-8">
            <p className="font-medium leading-tight text-cc-green-900">{reward.name}</p>
            {reward.category === "PRODUCT" && (
              <p className="text-xs font-semibold text-cc-gold-400">GRATIS</p>
            )}
          </div>
          <p className="text-xs font-semibold text-muted-foreground">{reward.pointsCost} pts</p>
          {eligible ? (
            <RedeemButton
              rewardId={reward.id}
              rewardName={reward.name}
              pointsCost={reward.pointsCost}
              pointsBalance={pointsBalance}
              size="sm"
            />
          ) : (
            <Button size="sm" variant="outline" disabled>
              {reason ? REASON_LABEL[reason] : "No disponible"}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-cc-cream-50 py-12 text-center">
      <Gift className="size-8 text-muted-foreground" />
      <p className="font-medium text-cc-green-900">
        {label ?? "Seguí sumando puntos para desbloquear nuevos beneficios."}
      </p>
    </div>
  );
}
