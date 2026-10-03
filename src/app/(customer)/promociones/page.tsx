import type { Metadata } from "next";
import { Sparkles, Percent, Gift, Coins } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import {
  listActivePromotionsForCustomer,
  listUpcomingPromotionsForCustomer,
} from "@/server/services/promotion-service";
import { BrandIcon } from "@/components/shared/brand-icon";

export const metadata: Metadata = { title: "Promociones" };

const TYPE_ICON: Record<string, typeof Sparkles> = {
  POINTS_MULTIPLIER: Coins,
  BONUS_POINTS: Gift,
  DISCOUNT: Percent,
};

/** null when the promo's type-specific field isn't set (e.g. a purely
 * informational promo like "Día de la Madre") — no numeric badge to show. */
function promoBadgeLabel(promo: { type: string; multiplier: unknown; bonusPoints: number | null; discountPct: unknown }): string | null {
  switch (promo.type) {
    case "POINTS_MULTIPLIER":
      return promo.multiplier != null ? `x${promo.multiplier} puntos` : null;
    case "BONUS_POINTS":
      return promo.bonusPoints != null ? `+${promo.bonusPoints} puntos extra` : null;
    case "DISCOUNT":
      return promo.discountPct != null ? `${promo.discountPct}% de descuento` : null;
    default:
      return null;
  }
}

export default async function PromotionsPage() {
  const [promotions, upcoming] = await Promise.all([
    listActivePromotionsForCustomer(),
    listUpcomingPromotionsForCustomer(),
  ]);
  const now = new Date();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">Promociones</h1>
        <p className="text-sm text-muted-foreground">Aprovechá los beneficios activos por tiempo limitado.</p>
      </div>

      {promotions.length === 0 && upcoming.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-12 text-center">
          <Sparkles className="size-8 text-muted-foreground" />
          <p className="font-medium text-foreground">No hay promociones activas ahora.</p>
          <p className="text-sm text-muted-foreground">Volvé pronto, siempre hay algo nuevo. ☕</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {promotions.map((promo) => {
            const Icon = TYPE_ICON[promo.type] ?? Sparkles;
            const badgeLabel = promoBadgeLabel(promo);
            const daysLeft = differenceInCalendarDays(promo.endAt, now);
            const cardContent = (
              <>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                  {promo.icon ? <BrandIcon emoji={promo.icon} size={20} /> : <Icon className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-semibold text-foreground">{promo.name}</p>
                  {promo.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{promo.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {badgeLabel && (
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
                        {badgeLabel}
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
              </>
            );
            const cardClassName = "flex items-start gap-3 rounded-2xl border border-border bg-card p-4";
            return promo.ctaUrl ? (
              <a key={promo.id} href={promo.ctaUrl} target="_blank" rel="noopener noreferrer" className={cardClassName}>
                {cardContent}
              </a>
            ) : (
              <div key={promo.id} className={cardClassName}>
                {cardContent}
              </div>
            );
          })}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="font-heading font-semibold text-foreground">Próximamente</p>
          {upcoming.map((promo) => {
            const Icon = TYPE_ICON[promo.type] ?? Sparkles;
            const daysUntil = differenceInCalendarDays(promo.startAt, now);
            return (
              <div
                key={promo.id}
                className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-card p-4 opacity-80"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                  {promo.icon ? <BrandIcon emoji={promo.icon} size={20} /> : <Icon className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-semibold text-foreground">{promo.name}</p>
                  {promo.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{promo.description}</p>
                  )}
                  <span className="mt-2 inline-block text-xs font-medium text-muted-foreground">
                    {daysUntil <= 0 ? "Empieza hoy" : daysUntil === 1 ? "Empieza mañana" : `Empieza en ${daysUntil} días`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
