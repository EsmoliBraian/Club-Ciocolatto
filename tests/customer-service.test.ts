import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  claimBirthdayReward,
  isBirthdayWindowActive,
  claimAnniversaryReward,
  isAnniversaryWindowActive,
  checkAndAwardProfileCompletion,
  registerCustomer,
  CustomerServiceError,
} from "@/server/services/customer-service";
import { createTestCustomer, cleanupTestCustomer } from "./helpers";
import { BIRTHDAY_COFFEE_REWARD_ID, ANNIVERSARY_GIFT_REWARD_ID } from "@/lib/constants";
import type { RegisterInput } from "@/schemas/auth";

describe("customer-service: claimBirthdayReward", () => {
  let userId: string;
  let profileId: string;

  beforeEach(async () => {
    const { user, profile } = await createTestCustomer();
    userId = user.id;
    profileId = profile.id;
  });

  afterEach(async () => {
    await prisma.rewardRedemption.deleteMany({ where: { customerProfileId: profileId } });
    await cleanupTestCustomer(userId);
  });

  it("rejects claiming outside the birthday window", async () => {
    const farBirthday = new Date();
    farBirthday.setUTCMonth((farBirthday.getUTCMonth() + 6) % 12);
    await prisma.user.update({ where: { id: userId }, data: { birthDate: farBirthday, favoriteDrink: "Cappuccino" } });

    await expect(claimBirthdayReward(profileId)).rejects.toMatchObject({ code: "BIRTHDAY_WINDOW_CLOSED" });
  });

  it("grants points and a free-coffee redemption for the customer's favorite drink, once per year", async () => {
    await prisma.user.update({ where: { id: userId }, data: { birthDate: new Date(), favoriteDrink: "Cappuccino" } });
    expect(isBirthdayWindowActive(new Date())).toBe(true);

    const result = await claimBirthdayReward(profileId);
    expect(result.drink).toBe("Cappuccino");
    expect(result.redemptionCode).toBeTruthy();
    expect(result.pointsAwarded).toBeGreaterThan(0);

    const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.pointsBalance).toBe(result.pointsAwarded);

    const redemption = await prisma.rewardRedemption.findUnique({
      where: { redemptionCode: result.redemptionCode! },
    });
    expect(redemption?.rewardId).toBe(BIRTHDAY_COFFEE_REWARD_ID);
    expect(redemption?.pointsSpent).toBe(0);
    expect(redemption?.status).toBe("PENDING");

    // Claiming again the same year must be rejected, and must not grant a second redemption.
    await expect(claimBirthdayReward(profileId)).rejects.toMatchObject({ code: "ALREADY_CLAIMED" });
    const redemptionCount = await prisma.rewardRedemption.count({ where: { customerProfileId: profileId } });
    expect(redemptionCount).toBe(1);
  });

  it("throws CustomerServiceError instances (not generic errors) on rejection", async () => {
    const farBirthday = new Date();
    farBirthday.setUTCMonth((farBirthday.getUTCMonth() + 6) % 12);
    await prisma.user.update({ where: { id: userId }, data: { birthDate: farBirthday } });

    await expect(claimBirthdayReward(profileId)).rejects.toBeInstanceOf(CustomerServiceError);
  });
});

describe("customer-service: claimAnniversaryReward", () => {
  let userId: string;
  let profileId: string;

  beforeEach(async () => {
    const { user, profile } = await createTestCustomer();
    userId = user.id;
    profileId = profile.id;
  });

  afterEach(async () => {
    await prisma.rewardRedemption.deleteMany({ where: { customerProfileId: profileId } });
    await cleanupTestCustomer(userId);
  });

  it("a brand-new account (0 years old) is not in its anniversary window yet", async () => {
    const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(isAnniversaryWindowActive(profile.createdAt)).toBe(false);
    await expect(claimAnniversaryReward(profileId)).rejects.toMatchObject({ code: "ANNIVERSARY_WINDOW_CLOSED" });
  });

  it("grants points and a gift redemption exactly one year after registration, once per year", async () => {
    const oneYearAgo = new Date();
    oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);
    await prisma.customerProfile.update({ where: { id: profileId }, data: { createdAt: oneYearAgo } });
    expect(isAnniversaryWindowActive(oneYearAgo)).toBe(true);

    const result = await claimAnniversaryReward(profileId);
    expect(result.redemptionCode).toBeTruthy();
    expect(result.pointsAwarded).toBeGreaterThan(0);

    const redemption = await prisma.rewardRedemption.findUnique({ where: { redemptionCode: result.redemptionCode! } });
    expect(redemption?.rewardId).toBe(ANNIVERSARY_GIFT_REWARD_ID);

    await expect(claimAnniversaryReward(profileId)).rejects.toMatchObject({ code: "ALREADY_CLAIMED" });
  });
});

describe("customer-service: checkAndAwardProfileCompletion", () => {
  let userId: string;
  let profileId: string;

  beforeEach(async () => {
    const { user, profile } = await createTestCustomer();
    userId = user.id;
    profileId = profile.id;
  });

  afterEach(async () => {
    await cleanupTestCustomer(userId);
  });

  it("does nothing while any of the required fields are still missing", async () => {
    await checkAndAwardProfileCompletion(userId);
    const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.profileCompletionAwardedAt).toBeNull();
  });

  it("awards the bonus exactly once, the moment every field is filled in", async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { phone: `+549complete${randomUUID().slice(0, 6)}`, birthDate: new Date("1995-01-01"), favoriteDrink: "Cappuccino", avatarUrl: "https://example.com/a.png" },
    });

    await checkAndAwardProfileCompletion(userId);
    const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.profileCompletionAwardedAt).not.toBeNull();

    const tx = await prisma.pointTransaction.findMany({ where: { customerProfileId: profileId, source: "PROFILE_COMPLETION" } });
    expect(tx).toHaveLength(1);

    // Calling it again (e.g. after another profile edit) must not re-pay it.
    await checkAndAwardProfileCompletion(userId);
    const txAfter = await prisma.pointTransaction.findMany({ where: { customerProfileId: profileId, source: "PROFILE_COMPLETION" } });
    expect(txAfter).toHaveLength(1);
  });
});

describe("customer-service: registerCustomer referral handling", () => {
  function buildInput(overrides: Partial<RegisterInput> = {}): RegisterInput {
    const suffix = randomUUID().slice(0, 8);
    return {
      firstName: "Nueva",
      lastName: suffix,
      email: `nueva-${suffix}@example.com`,
      phone: `+549nueva${suffix}`,
      password: "Test1234!",
      birthDate: new Date("1995-01-01"),
      favoriteDrink: "Cappuccino",
      acceptedTerms: true,
      acceptedMarketing: false,
      ...overrides,
    };
  }

  it("surfaces an invalid referral code as CustomerServiceError instead of crashing", async () => {
    const input = buildInput({ referralCode: "NOEXISTE99" });
    await expect(registerCustomer(input)).rejects.toBeInstanceOf(CustomerServiceError);

    // No account should have been created when registration is rejected up front.
    const created = await prisma.user.findUnique({ where: { email: input.email } });
    expect(created).toBeNull();
  });

  it("surfaces a self-referral code as CustomerServiceError instead of crashing", async () => {
    const { user, profile } = await createTestCustomer();
    try {
      const input = buildInput({ email: user.email, phone: user.phone!, referralCode: profile.referralCode });
      await expect(registerCustomer(input)).rejects.toBeInstanceOf(CustomerServiceError);
    } finally {
      await cleanupTestCustomer(user.id);
    }
  });

  it("links a valid referral code to the new account", async () => {
    const sponsor = await createTestCustomer();
    const input = buildInput({ referralCode: sponsor.profile.referralCode });
    try {
      const { user } = await registerCustomer(input);
      const referral = await prisma.referral.findFirst({ where: { referrerId: sponsor.profile.id } });
      expect(referral?.codeUsed).toBe(sponsor.profile.referralCode);
      await cleanupTestCustomer(user.id);
    } finally {
      await cleanupTestCustomer(sponsor.user.id);
    }
  });
});
