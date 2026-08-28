import { z } from "zod";

export const tierSchema = z.object({
  name: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  minimumPoints: z.coerce.number().int().min(0),
  maximumPoints: z.coerce.number().int().min(0).optional(),
  description: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  color: z.string().trim().optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  benefits: z
    .string()
    .trim()
    .transform((val) => val.split("\n").map((line) => line.trim()).filter(Boolean)),
  active: z.coerce.boolean().default(true),
});
export type TierInput = z.infer<typeof tierSchema>;

export const missionTypeEnum = z.enum([
  "PURCHASE_COUNT",
  "VISIT_COUNT",
  "SPEND_AMOUNT",
  "PRODUCT_PURCHASE",
  "CATEGORY_PURCHASE",
  "REFERRAL",
  "SPECIAL_DATE",
  "RAINY_DAY",
  "CUSTOM",
]);

export const missionSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().min(2),
  icon: z.string().trim().optional(),
  type: missionTypeEnum,
  targetValue: z.coerce.number().int().min(1),
  productId: z.string().trim().optional(),
  category: z.string().trim().optional(),
  rewardPoints: z.coerce.number().int().min(0).default(0),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  perUserLimit: z.coerce.number().int().min(1).default(1),
  segment: z.string().trim().optional(),
  active: z.coerce.boolean().default(true),
});
export type MissionInput = z.infer<typeof missionSchema>;

export const rewardSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  pointsCost: z.coerce.number().int().min(1),
  stock: z.coerce.number().int().min(0).optional(),
  requiredTierId: z.string().trim().optional(),
  perUserLimit: z.coerce.number().int().min(1).optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  active: z.coerce.boolean().default(true),
});
export type RewardInput = z.infer<typeof rewardSchema>;

export const promotionTypeEnum = z.enum(["POINTS_MULTIPLIER", "BONUS_POINTS", "DISCOUNT"]);

export const promotionSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
  type: promotionTypeEnum,
  multiplier: z.coerce.number().min(1).optional(),
  bonusPoints: z.coerce.number().int().min(0).optional(),
  discountPct: z.coerce.number().min(0).max(100).optional(),
  category: z.string().trim().optional(),
  productId: z.string().trim().optional(),
  segment: z.string().trim().optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  active: z.coerce.boolean().default(true),
});
export type PromotionInput = z.infer<typeof promotionSchema>;

export const productSchema = z.object({
  name: z.string().trim().min(2),
  category: z.string().trim().optional(),
  price: z.coerce.number().min(0),
  pointsMultiplier: z.coerce.number().min(0).default(1),
  bonusPoints: z.coerce.number().int().min(0).default(0),
  active: z.coerce.boolean().default(true),
});
export type ProductInput = z.infer<typeof productSchema>;

export const loyaltyConfigSchema = z.object({
  amountPerPoint: z.coerce.number().positive(),
  pointsPerAmount: z.coerce.number().positive(),
  registrationPoints: z.coerce.number().int().min(0),
  firstPurchasePoints: z.coerce.number().int().min(0),
  birthdayPoints: z.coerce.number().int().min(0),
  referralSponsorPoints: z.coerce.number().int().min(0),
  referralRefereePoints: z.coerce.number().int().min(0),
  pointsExpireAfterDays: z.coerce.number().int().min(0).optional(),
  redemptionCodeExpiryHours: z.coerce.number().int().min(1),
  businessName: z.string().trim().min(1),
  logoUrl: z.string().trim().url().optional().or(z.literal("")),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  contactPhone: z.string().trim().optional(),
  instagramUrl: z.string().trim().url().optional().or(z.literal("")),
});
export type LoyaltyConfigInput = z.infer<typeof loyaltyConfigSchema>;
