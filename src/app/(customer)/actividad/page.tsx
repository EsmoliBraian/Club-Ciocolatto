import type { Metadata } from "next";
import { Coins, Gift, TrendingUp, Trophy, Cake, Users, Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { listRecentNotifications } from "@/server/services/notification-service";
import { groupByDay } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Actividad" };

const TYPE_META: Record<string, { icon: typeof Bell; style: string }> = {
  POINTS_EARNED: { icon: Coins, style: "bg-emerald-100 text-emerald-600" },
  POINTS_REDEEMED: { icon: Gift, style: "bg-orange-100 text-orange-600" },
  TIER_UPGRADED: { icon: TrendingUp, style: "bg-sky-100 text-sky-600" },
  MISSION_COMPLETED: { icon: Trophy, style: "bg-amber-100 text-amber-600" },
  REWARD_UNLOCKED: { icon: Gift, style: "bg-rose-100 text-rose-600" },
  BIRTHDAY: { icon: Cake, style: "bg-pink-100 text-pink-600" },
  REFERRAL_COMPLETED: { icon: Users, style: "bg-violet-100 text-violet-600" },
  GENERAL: { icon: Bell, style: "bg-secondary text-primary" },
};

export default async function ActivityPage() {
  const session = await auth();
  const notifications = await listRecentNotifications(session!.user.id);
  const groups = groupByDay(notifications, (n) => n.createdAt);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 pt-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">Actividad</h1>
        <p className="text-sm text-muted-foreground">Todo lo que pasó en tu cuenta del Club.</p>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Todavía no tenés actividad registrada.
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {group.label}
            </p>
            <Card>
              <CardContent className="flex flex-col divide-y divide-border p-0">
                {group.items.map((n) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.GENERAL;
                  const Icon = meta.icon;
                  return (
                    <div key={n.id} className="flex items-start gap-3 px-4 py-3">
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${meta.style}`}>
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.body}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        ))
      )}
    </div>
  );
}
