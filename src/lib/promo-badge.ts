import { Coins, Gift, Percent, type LucideIcon } from "lucide-react";

export const PROMO_TYPE_ICON: Record<string, LucideIcon> = {
  POINTS_MULTIPLIER: Coins,
  BONUS_POINTS: Gift,
  DISCOUNT: Percent,
};

/** null when the promo's type-specific field isn't set (e.g. a purely
 * informational promo like "Día de la Madre") — no numeric badge to show. */
export function promoBadgeLabel(promo: {
  type: string;
  multiplier: unknown;
  bonusPoints: number | null;
  discountPct: unknown;
}): string | null {
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
