import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sparkles, MessageCircle } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { getPromotionById } from "@/server/services/promotion-service";
import { BackHeader } from "@/components/shared/back-header";
import { BrandIcon } from "@/components/shared/brand-icon";
import { PROMO_TYPE_ICON, promoBadgeLabel } from "@/lib/promo-badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Promoción" };

export default async function PromotionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const promo = await getPromotionById(id);
  if (!promo) notFound();

  const now = new Date();
  const Icon = PROMO_TYPE_ICON[promo.type] ?? Sparkles;
  const badgeLabel = promoBadgeLabel(promo);
  const isActive = promo.active && promo.startAt <= now && promo.endAt >= now;
  const isUpcoming = promo.startAt > now;
  const daysLeft = differenceInCalendarDays(promo.endAt, now);
  const daysUntil = differenceInCalendarDays(promo.startAt, now);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <BackHeader title="Promoción" href="/promociones" />

      <div
        className="relative flex min-h-40 flex-col justify-end overflow-hidden rounded-2xl border border-border p-5"
        style={
          promo.imageUrl
            ? {
                backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.15)), url(${promo.imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {!promo.imageUrl && <div className="absolute inset-0 bg-primary/10" />}
        <span className="relative mb-2 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {promo.icon ? <BrandIcon emoji={promo.icon} size={22} /> : <Icon className="size-6" />}
        </span>
        <p
          className={cn(
            "relative font-heading text-xl font-semibold",
            promo.imageUrl ? "text-white" : "text-foreground"
          )}
        >
          {promo.name}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {badgeLabel && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">{badgeLabel}</span>
        )}
        {isActive && (
          <span className="text-xs font-medium text-cc-warning">
            {daysLeft <= 0 ? "Termina hoy" : daysLeft === 1 ? "Termina mañana" : `${daysLeft} días restantes`}
          </span>
        )}
        {isUpcoming && (
          <span className="text-xs font-medium text-muted-foreground">
            {daysUntil <= 0 ? "Empieza hoy" : daysUntil === 1 ? "Empieza mañana" : `Empieza en ${daysUntil} días`}
          </span>
        )}
      </div>

      {promo.description && <p className="text-sm text-foreground">{promo.description}</p>}

      {promo.ctaUrl && (
        <a
          href={promo.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
        >
          <MessageCircle className="size-4" />
          Enviar mensaje
        </a>
      )}
    </div>
  );
}
