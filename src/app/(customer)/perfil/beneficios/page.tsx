import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { getRedemptionHistory } from "@/server/services/reward-service";
import { BackHeader } from "@/components/shared/back-header";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Mis beneficios" };

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  PENDING: { label: "Pendiente", variant: "default" },
  USED: { label: "Usado", variant: "secondary" },
  EXPIRED: { label: "Vencido", variant: "destructive" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
};

export default async function BenefitsHistoryPage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  const redemptions = await getRedemptionHistory(profile.id);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <BackHeader title="Mis beneficios" />

      {redemptions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Todavía no canjeaste beneficios.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {redemptions.map((r) => {
            const status = STATUS_LABEL[r.status];
            return (
              <Card key={r.id}>
                <CardContent className="flex flex-col gap-2 py-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{r.reward.name}</p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDateTime(r.createdAt)}</p>
                  {r.status === "PENDING" && (
                    <p className="rounded-lg bg-secondary px-3 py-2 text-center font-heading text-lg font-semibold tracking-widest">
                      {r.redemptionCode}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
