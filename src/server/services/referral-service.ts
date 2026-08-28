import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import { awardPoints } from "@/server/services/loyalty-service";
import { notify } from "@/server/services/notification-service";
import { getLoyaltyConfig } from "@/server/services/config-service";

export class ReferralError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function resolveReferralCode(code: string, db: Db = prisma) {
  return db.customerProfile.findUnique({
    where: { referralCode: code.trim().toUpperCase() },
    include: { user: true },
  });
}

/**
 * Called during registration, before the new CustomerProfile is committed.
 * Blocks self-referral by comparing contact details against the sponsor's account
 * — the DB's `refereeId @unique` constraint on Referral separately guarantees a
 * referred user can only ever have one sponsor.
 */
export async function validateReferralCode(
  code: string,
  newUser: { email: string; phone?: string | null },
  db: Db = prisma
) {
  const referrer = await resolveReferralCode(code, db);
  if (!referrer) throw new ReferralError("INVALID_CODE", "El código de invitación no existe.");
  if (
    referrer.user.email === newUser.email ||
    (newUser.phone && referrer.user.phone === newUser.phone)
  ) {
    throw new ReferralError("SELF_REFERRAL", "No podés usar tu propio código de invitación.");
  }
  return referrer;
}

export async function createReferral(
  db: Db,
  params: { referrerProfileId: string; refereeProfileId: string; codeUsed: string }
) {
  return db.referral.create({
    data: {
      referrerId: params.referrerProfileId,
      refereeId: params.refereeProfileId,
      codeUsed: params.codeUsed,
      status: "PENDING",
    },
  });
}

/** Call after a customer's order is registered — completes their referral on first purchase only. */
export async function completeReferralOnFirstPurchase(db: Db, refereeProfileId: string) {
  const referral = await db.referral.findUnique({ where: { refereeId: refereeProfileId } });
  if (!referral || referral.status !== "PENDING") return null;

  const config = await getLoyaltyConfig(db);
  const referrerPoints = config.referralSponsorPoints;
  const refereePoints = config.referralRefereePoints;

  // Sequential, not Promise.all: `db` may be an interactive transaction client
  // bound to a single connection, where concurrent queries would race.
  const referrerProfile = await db.customerProfile.findUniqueOrThrow({
    where: { id: referral.referrerId },
    include: { user: true },
  });
  const refereeProfile = await db.customerProfile.findUniqueOrThrow({
    where: { id: referral.refereeId },
    include: { user: true },
  });

  if (referrerPoints > 0) {
    await awardPoints(
      {
        customerProfileId: referral.referrerId,
        type: "EARN",
        source: "REFERRAL_SPONSOR",
        amount: referrerPoints,
        description: `Referido: ${refereeProfile.user.firstName} hizo su primera compra`,
        referenceType: "Referral",
        referenceId: referral.id,
        silent: true,
      },
      db
    );
  }
  if (refereePoints > 0) {
    await awardPoints(
      {
        customerProfileId: referral.refereeId,
        type: "EARN",
        source: "REFERRAL_REFEREE",
        amount: refereePoints,
        description: "Bono por unirte con una invitación",
        referenceType: "Referral",
        referenceId: referral.id,
        silent: true,
      },
      db
    );
  }

  const updated = await db.referral.update({
    where: { id: referral.id },
    data: {
      status: "COMPLETED",
      referrerPointsAwarded: referrerPoints,
      refereePointsAwarded: refereePoints,
      completedAt: new Date(),
    },
  });

  await notify(
    {
      userId: referrerProfile.user.id,
      type: "REFERRAL_COMPLETED",
      title: "¡Tu amigo hizo su primera compra! 🎉",
      body: `Sumaste ${referrerPoints} puntos por invitarlo.`,
    },
    db
  );

  return updated;
}

export interface ReferralStats {
  invited: number;
  completed: number;
  pointsEarned: number;
}

export async function getReferralStats(customerProfileId: string, db: Db = prisma): Promise<ReferralStats> {
  const referrals = await db.referral.findMany({ where: { referrerId: customerProfileId } });
  return {
    invited: referrals.length,
    completed: referrals.filter((r) => r.status === "COMPLETED").length,
    pointsEarned: referrals.reduce((sum, r) => sum + r.referrerPointsAwarded, 0),
  };
}
