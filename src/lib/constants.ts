/** Options offered at registration / in "Mis datos" for the customer's favorite drink. */
export const FAVORITE_DRINK_OPTIONS = [
  "Espresso",
  "Café con leche",
  "Cortado",
  "Latte saborizado",
  "Cappuccino",
  "Cappuccino especial",
  "Té",
  "Café frío",
  "Otro",
] as const;

/** Stable id of the seeded, hidden "birthday coffee" Reward — granted automatically, never listed in the store. */
export const BIRTHDAY_COFFEE_REWARD_ID = "seed-reward-birthday-coffee";

/** Stable id of the seeded, hidden "anniversary gift" Reward — granted automatically, never listed in the store. */
export const ANNIVERSARY_GIFT_REWARD_ID = "seed-reward-anniversary-gift";

/** Stable id of the seeded, hidden "win-back coupon" Reward — granted automatically, never listed in the store. */
export const WINBACK_COUPON_REWARD_ID = "seed-reward-winback-coupon";

/** Stable id of the seeded, hidden "free coffee of choice" Reward — granted automatically by the "Misión Café" mission, never listed in the store. */
export const FREE_COFFEE_CHOICE_REWARD_ID = "seed-reward-cafe-eleccion";

/** Weekly visit-streak milestones: consecutive weeks with at least one QUALIFYING visit (order ≥ LoyaltyConfig.visitMinimumAmount) → bonus points, paid once per milestone. */
export const VISIT_STREAK_MILESTONES = [
  { weeks: 4, points: 25 },
  { weeks: 8, points: 50 },
  { weeks: 12, points: 100 },
] as const;

/** Suggested points shown to the customer when submitting a PointClaim — the admin can still adjust the final award at approval time. */
export const POINT_CLAIM_SUGGESTED_POINTS: Record<"SOCIAL_MEDIA_POST" | "REVIEW" | "CUSTOM", number> = {
  SOCIAL_MEDIA_POST: 30,
  REVIEW: 30,
  CUSTOM: 0,
};

/** A customer may only submit one PointClaim (review/social post) per calendar month. */
export const POINT_CLAIM_MONTHLY_LIMIT = 1;

/** Window (in days) used to compute a tier from PURCHASE points — "últimos 12 meses". */
export const TIER_WINDOW_DAYS = 365;

/** Advance-notice window for the points-expiry warning cron (fixed, not admin-configurable — keeps scope tight). */
export const POINTS_EXPIRING_WARNING_WINDOW_DAYS = 7;
