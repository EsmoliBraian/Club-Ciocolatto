"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCustomerProfile } from "@/lib/rbac";
import { claimBirthdayReward, CustomerServiceError } from "@/server/services/customer-service";
import { redeemReward as redeemRewardService, RewardRedemptionError } from "@/server/services/reward-service";

export async function claimBirthdayRewardAction() {
  const { profile } = await requireCustomerProfile();
  try {
    const result = await claimBirthdayReward(profile.id);
    revalidatePath("/inicio");
    return { success: true as const, pointsAwarded: result.pointsAwarded };
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
