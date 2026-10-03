import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import {
  listActivePromotionsForCustomer,
  listUpcomingPromotionsForCustomer,
} from "@/server/services/promotion-service";
import { BrandIcon } from "@/components/shared/brand-icon";
import { PROMO_TYPE_ICON, promoBadgeLabel } from "@/lib/promo-badge";

export const metadata: Metadata = { title: "Promociones" };

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
            const Icon = PROMO_TYPE_ICON[promo.type] ?? Sparkles;
            const badgeLabel = promoBadgeLabel(promo);
            const daysLeft = differenceInCalendarDays(promo.endAt, now);
            return (
              <Link
                key={promo.id}
                href={`/promociones/${promo.id}`}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted"
              >
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
              </Link>
            );
          })}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="font-heading font-semibold text-foreground">Próximamente</p>
          {upcoming.map((promo) => {
            const Icon = PROMO_TYPE_ICON[promo.type] ?? Sparkles;
            const daysUntil = differenceInCalendarDays(promo.startAt, now);
            return (
              <Link
                key={promo.id}
                href={`/promociones/${promo.id}`}
                className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-card p-4 opacity-80 transition-colors hover:bg-muted"
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
