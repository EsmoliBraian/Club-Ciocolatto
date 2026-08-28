import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { claimBirthdayReward, isBirthdayWindowActive, CustomerServiceError } from "@/server/services/customer-service";
import { createTestCustomer, cleanupTestCustomer } from "./helpers";
import { BIRTHDAY_COFFEE_REWARD_ID } from "@/lib/constants";

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
    await prisma.user.update({ where: { id: userId }, data: { birthDate: farBirthday, favoriteDrink: "Latte" } });

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
