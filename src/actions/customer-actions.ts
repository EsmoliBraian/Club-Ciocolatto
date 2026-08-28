"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCustomerProfile } from "@/lib/rbac";
import { claimBirthdayReward, CustomerServiceError } from "@/server/services/customer-service";
import { redeemReward as redeemRewardService, RewardRedemptionError } from "@/server/services/reward-service";
import { updateProfileSchema } from "@/schemas/auth";

export interface UpdateProfileState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

export async function updateProfileAction(
  _prev: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const { user } = await requireCustomerProfile();

  const parsed = updateProfileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    birthDate: formData.get("birthDate"),
    favoriteDrink: formData.get("favoriteDrink"),
  });
  if (!parsed.success) {
    return { error: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const phoneTaken = await prisma.user.findFirst({
    where: { phone: parsed.data.phone, NOT: { id: user.id } },
  });
  if (phoneTaken) return { error: "Ese teléfono ya está en uso por otra cuenta." };

  await prisma.user.update({ where: { id: user.id }, data: parsed.data });

  revalidatePath("/perfil");
  revalidatePath("/perfil/datos");
  return { success: true };
}

export async function claimBirthdayRewardAction() {
  const { profile } = await requireCustomerProfile();
  try {
    const result = await claimBirthdayReward(profile.id);
    revalidatePath("/inicio");
    revalidatePath("/perfil/beneficios");
    return {
      success: true as const,
      pointsAwarded: result.pointsAwarded,
      drink: result.drink,
      redemptionCode: result.redemptionCode,
    };
  } catch (error) {
    if (error instanceof CustomerServiceError) return { success: false as const, error: error.message };
    throw error;
  }
}

export async function redeemRewardAction(rewardId: string) {
  const { profile } = await requireCustomerProfile();
  try {
    const result = await prisma.$transaction((tx) =>
      redeemRewardService(tx, { customerProfileId: profile.id, rewardId })
    );
    revalidatePath("/canjear");
    revalidatePath("/inicio");
    revalidatePath("/perfil");
    return { success: true as const, ...result };
  } catch (error) {
    if (error instanceof RewardRedemptionError) return { success: false as const, error: error.message };
    throw error;
  }
}
