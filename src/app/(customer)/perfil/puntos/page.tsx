import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { getPointsHistory } from "@/server/services/loyalty-service";
import { BackHeader } from "@/components/shared/back-header";
import { groupByDay } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Historial de puntos" };

export default async function PointsHistoryPage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  const transactions = await getPointsHistory(profile.id);
  const groups = groupByDay(transactions, (t) => t.createdAt);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 pt-6">
      <BackHeader title="Historial de puntos" />

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Todavía no tenés movimientos de puntos.
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
                {group.items.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                    </div>
                    <span
                      className={`shrink-0 font-heading text-sm font-semibold tabular-nums ${
                        tx.amount >= 0 ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {tx.amount} puntos
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))
      )}
    </div>
  );
}
