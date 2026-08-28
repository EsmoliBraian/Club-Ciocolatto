import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import { hashPassword } from "@/lib/password";
import { buildReferralCodeCandidate, generateQrToken } from "@/lib/codes";
import { awardPoints } from "@/server/services/loyalty-service";
import { validateReferralCode, createReferral } from "@/server/services/referral-service";
import { notify } from "@/server/services/notification-service";
import { getLoyaltyConfig } from "@/server/services/config-service";
import type { RegisterInput } from "@/schemas/auth";

export class CustomerServiceError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function generateUniqueReferralCode(db: Db, firstName: string): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const candidate = buildReferralCodeCandidate(firstName);
    const exists = await db.customerProfile.findUnique({ where: { referralCode: candidate } });
    if (!exists) return candidate;
  }
  throw new Error("Could not generate a unique referral code after 8 attempts");
}

export async function generateUniqueQrToken(db: Db): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = generateQrToken();
    const exists = await db.customerProfile.findUnique({ where: { qrToken: candidate } });
    if (!exists) return candidate;
  }
  throw new Error("Could not generate a unique QR token after 5 attempts");
}

/** Registers a new customer end to end: account, profile, referral link, welcome points. */
export async function registerCustomer(input: RegisterInput) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, ...(input.phone ? [{ phone: input.phone }] : [])] },
  });
  if (existing) {
    throw new CustomerServiceError(
      "EMAIL_OR_PHONE_TAKEN",
      "Ya existe una cuenta con ese email o teléfono."
    );
  }

  const referrer = input.referralCode
    ? await validateReferralCode(input.referralCode, { email: input.email, phone: input.phone })
    : null;

  const [passwordHash, config] = await Promise.all([
    hashPassword(input.password),
    getLoyaltyConfig(),
  ]);

  return prisma.$transaction(async (tx) => {
    // Sequential, not Promise.all: an interactive transaction is bound to a single
    // connection, so concurrent queries against `tx` would race on it.
    const referralCode = await generateUniqueReferralCode(tx, input.firstName);
    const qrToken = await generateUniqueQrToken(tx);

    const user = await tx.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: "CUSTOMER",
        firstName: input.firstName,
        lastName: input.lastName,
        birthDate: input.birthDate,
        acceptedTermsAt: new Date(),
        acceptedMarketingAt: input.acceptedMarketing ? new Date() : null,
      },
    });

    const profile = await tx.customerProfile.create({
      data: { userId: user.id, referralCode, qrToken },
    });

    if (referrer) {
      await createReferral(tx, {
        referrerProfileId: referrer.id,
        refereeProfileId: profile.id,
        codeUsed: input.referralCode!.trim().toUpperCase(),
      });
    }

    if (config.registrationPoints > 0) {
      await awardPoints(
        {
          customerProfileId: profile.id,
          type: "EARN",
          source: "REGISTRATION",
          amount: config.registrationPoints,
          description: "Bienvenida al Club Ciocolatto",
          referenceType: "User",
          referenceId: user.id,
          silent: true,
        },
        tx
      );
    }

    await notify(
      {
        userId: user.id,
        type: "GENERAL",
        title: "¡Bienvenido al Club Ciocolatto! ☕",
        body: "Ya podés empezar a sumar puntos en cada visita.",
      },
      tx
    );

    return { user, profile };
  });
}

export async function getCustomerProfileByUserId(userId: string, db: Db = prisma) {
  return db.customerProfile.findUnique({
    where: { userId },
    include: { user: true, tier: true },
  });
}

export async function getCustomerProfileByQrToken(qrToken: string, db: Db = prisma) {
  return db.customerProfile.findUnique({
    where: { qrToken },
    include: { user: true, tier: true },
  });
}

/** True when `birthDate`'s month/day falls within `windowDays` of today, either side. */
export function isBirthdayWindowActive(
  birthDate: Date | null | undefined,
  windowDays = 7,
  now = new Date()
): boolean {
  if (!birthDate) return false;
  const year = now.getFullYear();
  const thisYear = new Date(year, birthDate.getUTCMonth(), birthDate.getUTCDate());
  const diffDays = Math.abs((now.getTime() - thisYear.getTime()) / 86_400_000);
  const wrapDiffDays = 365 - diffDays; // handles birthdays spanning year-end (e.g. Dec 30 vs Jan 3)
  return Math.min(diffDays, wrapDiffDays) <= windowDays;
}

export async function claimBirthdayReward(customerProfileId: string) {
  const config = await getLoyaltyConfig();

  return prisma.$transaction(async (tx) => {
    const profile = await tx.customerProfile.findUniqueOrThrow({
      where: { id: customerProfileId },
      include: { user: true },
    });

    if (!isBirthdayWindowActive(profile.user.birthDate)) {
      throw new CustomerServiceError("BIRTHDAY_WINDOW_CLOSED", "Todavía no es tu semana de cumpleaños.");
    }

    const currentYear = new Date().getFullYear();
    if (profile.birthdayRewardClaimedYear === currentYear) {
      throw new CustomerServiceError("ALREADY_CLAIMED", "Ya reclamaste tu regalo de cumpleaños este año.");
    }

    await tx.customerProfile.update({
      where: { id: profile.id },
      data: { birthdayRewardClaimedYear: currentYear },
    });

    if (config.birthdayPoints > 0) {
      await awardPoints(
        {
          customerProfileId: profile.id,
          type: "BONUS",
          source: "BIRTHDAY",
          amount: config.birthdayPoints,
          description: "Regalo de cumpleaños 🎂",
          referenceType: "Birthday",
          referenceId: String(currentYear),
          silent: true,
        },
        tx
      );
    }

    await notify(
      {
        userId: profile.user.id,
        type: "BIRTHDAY",
        title: "¡Feliz cumpleaños! 🎂",
        body: `Tenemos un regalo para vos: +${config.birthdayPoints} puntos.`,
      },
      tx
    );

    return { pointsAwarded: config.birthdayPoints };
  });
}
