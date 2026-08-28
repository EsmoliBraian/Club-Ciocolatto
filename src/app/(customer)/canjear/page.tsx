import type { Metadata } from "next";
import { Gift, Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { listRewardsForCustomer } from "@/server/services/reward-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Canjear</h1>
        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary">
          <Star className="size-3.5 fill-cc-gold-400 text-cc-gold-400" />
          {profile.pointsBalance} puntos
        </div>
      </div>

      {rewards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Gift className="size-8 text-muted-foreground" />
            <p className="font-medium">Seguí sumando puntos para desbloquear nuevos beneficios.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {rewards.map(({ reward, eligible, reason }) => (
            <Card key={reward.id} className={!eligible ? "opacity-70" : undefined}>
              <CardContent className="flex flex-col gap-2 py-4">
                <p className="font-medium leading-tight">{reward.name}</p>
                {reward.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{reward.description}</p>
                )}
                <p className="text-sm font-semibold text-cc-gold-400">{reward.pointsCost} pts</p>
                {eligible ? (
                  <RedeemButton
                    rewardId={reward.id}
                    rewardName={reward.name}
                    pointsCost={reward.pointsCost}
                    pointsBalance={profile.pointsBalance}
                    size="sm"
                  />
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    {reason ? REASON_LABEL[reason] : "No disponible"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
