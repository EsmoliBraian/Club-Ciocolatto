"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, ADMIN_ROLES } from "@/lib/rbac";
import { recordAuditLog } from "@/server/services/audit-service";
import { grantFreeReward } from "@/server/services/reward-service";
import { generateApiKey } from "@/lib/codes";
import { hashApiKey } from "@/lib/api-auth";
import {
  tierSchema,
  missionSchema,
  rewardSchema,
  promotionSchema,
  productSchema,
  loyaltyConfigSchema,
} from "@/schemas/admin";

const API_KEY_SCOPES = ["orders:write", "customers:read", "customers:write", "refunds:write"] as const;

/** Resolves a scanned QR token / typed email / typed phone to a customer, for the admin "Escanear QR" shortcut. */
export async function findCustomerIdByQueryAction(
  query: string
): Promise<{ id: string } | { error: string }> {
  await requireRole(...ADMIN_ROLES);
  const trimmed = query.trim();
  if (!trimmed) return { error: "Ingresá un código QR, email o teléfono." };

  const profile = await prisma.customerProfile.findFirst({
    where: {
      OR: [
        { qrToken: trimmed },
        { user: { email: trimmed.toLowerCase() } },
        { user: { phone: trimmed } },
      ],
    },
    select: { id: true },
  });
  if (!profile) return { error: "No encontramos a ese cliente." };
  return { id: profile.id };
}

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function checkbox(formData: FormData, name: string): boolean {
  return formData.get(name) === "on" || formData.get(name) === "true";
}
function optionalString(formData: FormData, name: string): string | undefined {
  const v = String(formData.get(name) ?? "").trim();
  return v || undefined;
}

// ── Loyalty tiers ───────────────────────────────────────────────────────

export async function saveTierAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole(...ADMIN_ROLES);
  const id = optionalString(formData, "id");

  const parsed = tierSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    minimumPoints: formData.get("minimumPoints"),
    maximumPoints: optionalString(formData, "maximumPoints"),
    description: formData.get("description"),
    icon: formData.get("icon"),
    color: formData.get("color"),
    displayOrder: formData.get("displayOrder"),
    benefits: formData.get("benefits") ?? "",
    active: checkbox(formData, "active"),
  });
  if (!parsed.success) {
    return { error: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = { ...parsed.data, maximumPoints: parsed.data.maximumPoints ?? null };
  const tier = id
    ? await prisma.loyaltyTier.update({ where: { id }, data })
    : await prisma.loyaltyTier.create({ data });

  await recordAuditLog({
    actorId: actor.id,
    action: id ? "TIER_UPDATED" : "TIER_CREATED",
    entityType: "LoyaltyTier",
    entityId: tier.id,
    changes: data,
  });

  revalidatePath("/admin/niveles");
  return { success: true };
}

// ── Missions ─────────────────────────────────────────────────────────────

export async function saveMissionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole(...ADMIN_ROLES);
  const id = optionalString(formData, "id");

  const parsed = missionSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    icon: formData.get("icon"),
    type: formData.get("type"),
    targetValue: formData.get("targetValue"),
    productId: optionalString(formData, "productId"),
    category: optionalString(formData, "category"),
    rewardPoints: formData.get("rewardPoints"),
    startAt: optionalString(formData, "startAt"),
    endAt: optionalString(formData, "endAt"),
    perUserLimit: formData.get("perUserLimit"),
    segment: optionalString(formData, "segment"),
    active: checkbox(formData, "active"),
  });
  if (!parsed.success) {
    return { error: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const mission = id
    ? await prisma.mission.update({ where: { id }, data: parsed.data })
    : await prisma.mission.create({ data: parsed.data });

  await recordAuditLog({
    actorId: actor.id,
    action: id ? "MISSION_UPDATED" : "MISSION_CREATED",
    entityType: "Mission",
    entityId: mission.id,
    changes: parsed.data,
  });

  revalidatePath("/admin/misiones");
  return { success: true };
}

export async function toggleMissionActiveAction(id: string, active: boolean) {
  const actor = await requireRole(...ADMIN_ROLES);
  await prisma.mission.update({ where: { id }, data: { active } });
  await recordAuditLog({
    actorId: actor.id,
    action: active ? "MISSION_ACTIVATED" : "MISSION_DEACTIVATED",
    entityType: "Mission",
    entityId: id,
  });
  revalidatePath("/admin/misiones");
}

// ── Rewards ──────────────────────────────────────────────────────────────

export async function saveRewardAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole(...ADMIN_ROLES);
  const id = optionalString(formData, "id");

  const parsed = rewardSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl") ?? "",
    icon: formData.get("icon"),
    category: formData.get("category"),
    pointsCost: formData.get("pointsCost"),
    stock: optionalString(formData, "stock"),
    requiredTierId: optionalString(formData, "requiredTierId"),
    perUserLimit: optionalString(formData, "perUserLimit"),
    validFrom: optionalString(formData, "validFrom"),
    validUntil: optionalString(formData, "validUntil"),
    active: checkbox(formData, "active"),
  });
  if (!parsed.success) {
    return { error: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { imageUrl, ...rest } = parsed.data;
  const data = { ...rest, imageUrl: imageUrl || null };

  const reward = id
    ? await prisma.reward.update({ where: { id }, data })
    : await prisma.reward.create({ data });

  await recordAuditLog({
    actorId: actor.id,
    action: id ? "REWARD_UPDATED" : "REWARD_CREATED",
    entityType: "Reward",
    entityId: reward.id,
    changes: data,
  });

  revalidatePath("/admin/premios");
  return { success: true };
}

export async function toggleRewardActiveAction(id: string, active: boolean) {
  const actor = await requireRole(...ADMIN_ROLES);
  await prisma.reward.update({ where: { id }, data: { active } });
  await recordAuditLog({
    actorId: actor.id,
    action: active ? "REWARD_ACTIVATED" : "REWARD_DEACTIVATED",
    entityType: "Reward",
    entityId: id,
  });
  revalidatePath("/admin/premios");
}

// ── Promotions ───────────────────────────────────────────────────────────

export async function savePromotionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole(...ADMIN_ROLES);
  const id = optionalString(formData, "id");

  const parsed = promotionSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    type: formData.get("type"),
    multiplier: optionalString(formData, "multiplier"),
    bonusPoints: optionalString(formData, "bonusPoints"),
    discountPct: optionalString(formData, "discountPct"),
    category: optionalString(formData, "category"),
    productId: optionalString(formData, "productId"),
    segment: optionalString(formData, "segment"),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    active: checkbox(formData, "active"),
  });
  if (!parsed.success) {
    return { error: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const promotion = id
    ? await prisma.promotion.update({ where: { id }, data: parsed.data })
    : await prisma.promotion.create({ data: parsed.data });

  await recordAuditLog({
    actorId: actor.id,
    action: id ? "PROMOTION_UPDATED" : "PROMOTION_CREATED",
    entityType: "Promotion",
    entityId: promotion.id,
    changes: parsed.data,
  });

  revalidatePath("/admin/promociones");
  return { success: true };
}

// ── Products ─────────────────────────────────────────────────────────────

export async function saveProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole(...ADMIN_ROLES);
  const id = optionalString(formData, "id");

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    price: formData.get("price"),
    pointsMultiplier: formData.get("pointsMultiplier"),
    bonusPoints: formData.get("bonusPoints"),
    active: checkbox(formData, "active"),
  });
  if (!parsed.success) {
    return { error: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const product = id
    ? await prisma.product.update({ where: { id }, data: parsed.data })
    : await prisma.product.create({ data: parsed.data });

  await recordAuditLog({
    actorId: actor.id,
    action: id ? "PRODUCT_UPDATED" : "PRODUCT_CREATED",
    entityType: "Product",
    entityId: product.id,
    changes: parsed.data,
  });

  revalidatePath("/admin/productos");
  return { success: true };
}

// ── Manual reward grants (admin gifts a benefit without spending points) ──

export async function grantRewardAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole(...ADMIN_ROLES);
  const customerProfileId = String(formData.get("customerProfileId") ?? "");
  const rewardId = String(formData.get("rewardId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!customerProfileId || !rewardId) return { error: "Elegí un premio." };
  if (!reason) return { error: "El motivo es obligatorio." };

  const reward = await prisma.reward.findUniqueOrThrow({ where: { id: rewardId } });

  await prisma.$transaction(async (tx) => {
    const redemption = await grantFreeReward(tx, {
      customerProfileId,
      rewardId,
      notificationTitle: "🎁 Tenés un nuevo beneficio",
      notificationBody: `${reward.name} — mostrá el código en caja para retirarlo.`,
    });
    await recordAuditLog(
      {
        actorId: actor.id,
        action: "REWARD_GRANTED_BY_ADMIN",
        entityType: "RewardRedemption",
        entityId: redemption.id,
        changes: { rewardId, customerProfileId },
        reason,
      },
      tx
    );
  });

  revalidatePath(`/admin/clientes/${customerProfileId}`);
  return { success: true };
}

// ── POS integration API keys (SUPER_ADMIN only — sensitive credentials) ───

export interface CreateApiKeyState extends ActionState {
  plaintextKey?: string;
}

export async function createApiKeyAction(_prev: CreateApiKeyState, formData: FormData): Promise<CreateApiKeyState> {
  const actor = await requireRole("SUPER_ADMIN");
  const name = String(formData.get("name") ?? "").trim();
  const scopes = API_KEY_SCOPES.filter((scope) => formData.get(`scope_${scope}`) === "on");

  if (!name) return { error: "Ingresá un nombre para identificar la integración." };
  if (scopes.length === 0) return { error: "Elegí al menos un permiso." };

  const { plaintext, prefix } = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: { name, hashedKey: hashApiKey(plaintext), keyPrefix: prefix, scopes },
  });

  await recordAuditLog({
    actorId: actor.id,
    action: "API_KEY_CREATED",
    entityType: "ApiKey",
    entityId: apiKey.id,
    changes: { name, scopes },
  });

  revalidatePath("/admin/configuracion");
  return { success: true, plaintextKey: plaintext };
}

export async function revokeApiKeyAction(id: string) {
  const actor = await requireRole("SUPER_ADMIN");
  await prisma.apiKey.update({ where: { id }, data: { active: false, revokedAt: new Date() } });
  await recordAuditLog({ actorId: actor.id, action: "API_KEY_REVOKED", entityType: "ApiKey", entityId: id });
  revalidatePath("/admin/configuracion");
}

// ── Config ───────────────────────────────────────────────────────────────

export async function updateConfigAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireRole(...ADMIN_ROLES);

  const parsed = loyaltyConfigSchema.safeParse({
    amountPerPoint: formData.get("amountPerPoint"),
    pointsPerAmount: formData.get("pointsPerAmount"),
    registrationPoints: formData.get("registrationPoints"),
    firstPurchasePoints: formData.get("firstPurchasePoints"),
    birthdayPoints: formData.get("birthdayPoints"),
    referralSponsorPoints: formData.get("referralSponsorPoints"),
    referralRefereePoints: formData.get("referralRefereePoints"),
    pointsExpireAfterDays: optionalString(formData, "pointsExpireAfterDays"),
    redemptionCodeExpiryHours: formData.get("redemptionCodeExpiryHours"),
    businessName: formData.get("businessName"),
    logoUrl: formData.get("logoUrl") ?? "",
    contactEmail: formData.get("contactEmail") ?? "",
    contactPhone: formData.get("contactPhone"),
    instagramUrl: formData.get("instagramUrl") ?? "",
  });
  if (!parsed.success) {
    return { error: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { logoUrl, contactEmail, instagramUrl, ...rest } = parsed.data;
  const data = {
    ...rest,
    logoUrl: logoUrl || null,
    contactEmail: contactEmail || null,
    instagramUrl: instagramUrl || null,
    pointsExpireAfterDays: parsed.data.pointsExpireAfterDays ?? null,
  };

  await prisma.loyaltyConfig.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  await recordAuditLog({
    actorId: actor.id,
    action: "CONFIG_UPDATED",
    entityType: "LoyaltyConfig",
    entityId: "singleton",
    changes: data,
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/");
  return { success: true };
}
