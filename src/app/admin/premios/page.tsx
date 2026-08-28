import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RewardFormDialog } from "@/components/admin/reward-form-dialog";
import { ActiveToggle } from "@/components/admin/active-toggle";
import { toggleRewardActiveAction } from "@/actions/admin-actions";

export const metadata: Metadata = { title: "Premios" };

export default async function RewardsAdminPage() {
  const [rewards, tiers] = await Promise.all([
    prisma.reward.findMany({
      orderBy: { pointsCost: "asc" },
      include: { requiredTier: true, _count: { select: { redemptions: true } } },
    }),
    prisma.loyaltyTier.findMany({ orderBy: { displayOrder: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Premios</h1>
        <RewardFormDialog tiers={tiers} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rewards.map((reward) => (
          <Card key={reward.id}>
            <CardContent className="flex items-start justify-between gap-3 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-heading font-semibold">{reward.name}</p>
                  {reward.requiredTier && <Badge variant="secondary">{reward.requiredTier.name}</Badge>}
                </div>
                <p className="text-sm text-cc-gold-400 font-semibold">{reward.pointsCost} pts</p>
                <p className="text-xs text-muted-foreground">
                  {reward._count.redemptions} canjes
                  {reward.stock !== null && ` · stock: ${reward.stock}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ActiveToggle id={reward.id} active={reward.active} onToggle={toggleRewardActiveAction} />
                <RewardFormDialog reward={reward} tiers={tiers} />
              </div>
            </CardContent>
          </Card>
        ))}
        {rewards.length === 0 && (
          <p className="col-span-2 py-10 text-center text-sm text-muted-foreground">
            Todavía no creaste premios.
          </p>
        )}
      </div>
    </div>
  );
}
