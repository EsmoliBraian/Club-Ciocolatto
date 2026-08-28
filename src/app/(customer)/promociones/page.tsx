import type { Metadata } from "next";
import { Sparkles, Percent, Gift, Coins } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { listActivePromotionsForCustomer } from "@/server/services/promotion-service";

export const metadata: Metadata = { title: "Promociones" };

const TYPE_META: Record<string, { icon: typeof Sparkles; label: (p: { multiplier: unknown; bonusPoints: number | null; discountPct: unknown }) => string }> = {
  POINTS_MULTIPLIER: {
    icon: Coins,
    label: (p) => `x${p.multiplier} puntos`,
  },
  BONUS_POINTS: {
    icon: Gift,
    label: (p) => `+${p.bonusPoints} puntos extra`,
  },
  DISCOUNT: {
    icon: Percent,
    label: (p) => `${p.discountPct}% de descuento`,
  },
};

export default async function PromotionsPage() {
  const promotions = await listActivePromotionsForCustomer();
  const now = new Date();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">Promociones</h1>
        <p className="text-sm text-muted-foreground">Aprovechá los beneficios activos por tiempo limitado.</p>
      </div>

      {promotions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-12 text-center">
          <Sparkles className="size-8 text-muted-foreground" />
          <p className="font-medium text-foreground">No hay promociones activas ahora.</p>
          <p className="text-sm text-muted-foreground">Volvé pronto, siempre hay algo nuevo. ☕</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {promotions.map((promo) => {
            const meta = TYPE_META[promo.type];
            const Icon = meta?.icon ?? Sparkles;
            const daysLeft = differenceInCalendarDays(promo.endAt, now);
            return (
              <div
                key={promo.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cc-green-soft/25 text-cc-green-800">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-semibold text-foreground">{promo.name}</p>
                  {promo.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{promo.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {meta && (
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
                        {meta.label(promo)}
                      </span>
                    )}
                    {promo.product && (
                      <span className="text-xs text-muted-foreground">{promo.product.name}</span>
                    )}
                    <span className="text-xs font-medium text-cc-warning">
                      {daysLeft <= 0 ? "Termina hoy" : daysLeft === 1 ? "Termina mañana" : `${daysLeft} días restantes`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
