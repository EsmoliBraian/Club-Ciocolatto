import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PromotionFormDialog } from "@/components/admin/promotion-form-dialog";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Promociones" };

const TYPE_LABELS: Record<string, string> = {
  POINTS_MULTIPLIER: "Multiplicador",
  BONUS_POINTS: "Bonus fijo",
  DISCOUNT: "Descuento",
};

export default async function PromotionsAdminPage() {
  const promotions = await prisma.promotion.findMany({ orderBy: { startAt: "desc" } });
  const now = new Date();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Promociones</h1>
        <PromotionFormDialog />
      </div>

      <div className="flex flex-col gap-3">
        {promotions.map((promo) => {
          const isLive = promo.active && promo.startAt <= now && promo.endAt >= now;
          return (
            <Card key={promo.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-heading font-semibold">{promo.name}</p>
                    <Badge variant={isLive ? "default" : "secondary"}>{isLive ? "Vigente" : promo.active ? "Programada" : "Inactiva"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {TYPE_LABELS[promo.type]}
                    {promo.category && ` · ${promo.category}`} · {formatDateTime(promo.startAt)} → {formatDateTime(promo.endAt)}
                  </p>
                </div>
                <PromotionFormDialog promotion={promo} />
              </CardContent>
            </Card>
          );
        })}
        {promotions.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Todavía no creaste promociones.</p>
        )}
      </div>
    </div>
  );
}
