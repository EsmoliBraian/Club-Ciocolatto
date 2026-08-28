"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, STAFF_ROLES, ADMIN_ROLES } from "@/lib/rbac";
import { getCustomerProfileByQrToken } from "@/server/services/customer-service";
import { registerOrder, OrderServiceError } from "@/server/services/order-service";
import { awardPoints } from "@/server/services/loyalty-service";
import { recordAuditLog } from "@/server/services/audit-service";
import {
  findRedemptionByCode,
  markRedemptionUsed,
  RewardRedemptionError,
} from "@/server/services/reward-service";

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function findCustomerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(...STAFF_ROLES);
  const query = String(formData.get("query") ?? "").trim();
  if (!query) return { error: "Ingresá un código QR, email o teléfono." };

  let profile = await getCustomerProfileByQrToken(query);
  if (!profile) {
    profile = await prisma.customerProfile.findFirst({
      where: { user: { OR: [{ email: query.toLowerCase() }, { phone: query }] } },
      include: { user: true, tier: true },
    });
  }
  if (!profile) return { error: "No encontramos a ese cliente." };

  redirect(`/empleado/cliente/${profile.id}`);
}

export interface RegisterPurchaseState extends ActionState {
  pointsEarned?: number;
  alreadyProcessed?: boolean;
}

export async function registerPurchaseAction(
  _prev: RegisterPurchaseState,
  formData: FormData
): Promise<RegisterPurchaseState> {
  const employee = await requireRole(...STAFF_ROLES);
  const customerProfileId = String(formData.get("customerProfileId") ?? "");
  const totalAmount = Number(formData.get("totalAmount"));
  const paymentMethod = String(formData.get("paymentMethod") ?? "").trim() || undefined;
  const externalReference = String(formData.get("externalReference") ?? "").trim() || undefined;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  if (!customerProfileId || !Number.isFinite(totalAmount) || totalAmount <= 0) {
    return { error: "Ingresá un monto válido." };
  }

  try {
    const result = await registerOrder({
      customerProfileId,
      employeeId: employee.id,
      source: "MANUAL_EMPLOYEE",
      totalAmount,
      paymentMethod,
      externalReference,
      notes,
    });
    revalidatePath(`/empleado/cliente/${customerProfileId}`);
    return { success: true, pointsEarned: result.pointsEarned, alreadyProcessed: result.alreadyProcessed };
  } catch (error) {
    if (error instanceof OrderServiceError) return { error: error.message };
    throw error;
  }
}

export async function adjustPointsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const customerProfileId = String(formData.get("customerProfileId") ?? "");
  const amount = Number(formData.get("amount"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!customerProfileId || !Number.isFinite(amount) || amount === 0) {
    return { error: "Ingresá un monto de puntos válido." };
  }
  if (!reason) return { error: "El motivo es obligatorio." };

  const actor = await requireRole(...(amount < 0 ? ADMIN_ROLES : STAFF_ROLES));

  try {
    await prisma.$transaction(async (tx) => {
      await awardPoints(
        {
          customerProfileId,
          type: "ADJUSTMENT",
          source: "MANUAL_ADMIN",
          amount,
          description: reason,
          createdById: actor.id,
        },
        tx
      );
      await recordAuditLog(
        {
          actorId: actor.id,
          action: amount > 0 ? "ADMIN_ADDED_POINTS" : "ADMIN_REMOVED_POINTS",
          entityType: "CustomerProfile",
          entityId: customerProfileId,
          changes: { amount },
          reason,
        },
        tx
      );
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_POINTS") {
      return { error: "El cliente no tiene suficientes puntos para restar esa cantidad." };
    }
    throw error;
  }

  revalidatePath(`/empleado/cliente/${customerProfileId}`);
  revalidatePath(`/admin/clientes/${customerProfileId}`);
  return { success: true };
}

export interface ValidateRedemptionState extends ActionState {
  rewardName?: string;
  customerName?: string;
}

export async function lookupRedemptionAction(code: string) {
  await requireRole(...STAFF_ROLES);
  const redemption = await findRedemptionByCode(code);
  if (!redemption) return { error: "Código no encontrado." } as const;
  return {
    redemption: {
      code: redemption.redemptionCode,
      status: redemption.status,
      rewardName: redemption.reward.name,
      pointsSpent: redemption.pointsSpent,
      customerName: `${redemption.customerProfile.user.firstName} ${redemption.customerProfile.user.lastName}`,
      expiresAt: redemption.expiresAt,
    },
  } as const;
}

export async function validateRedemptionAction(
  _prev: ValidateRedemptionState,
  formData: FormData
): Promise<ValidateRedemptionState> {
  const employee = await requireRole(...STAFF_ROLES);
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Ingresá un código." };

  try {
    const redemption = await prisma.$transaction((tx) =>
      markRedemptionUsed(tx, { redemptionCode: code, employeeId: employee.id })
    );
    const full = await findRedemptionByCode(redemption.redemptionCode);
    return {
      success: true,
      rewardName: full?.reward.name,
      customerName: full ? `${full.customerProfile.user.firstName} ${full.customerProfile.user.lastName}` : undefined,
    };
  } catch (error) {
    if (error instanceof RewardRedemptionError) return { error: error.message };
    throw error;
  }
}
