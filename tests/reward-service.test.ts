import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/server/services/loyalty-service";
import { redeemReward, markRedemptionUsed, RewardRedemptionError } from "@/server/services/reward-service";
import { createTestCustomer, cleanupTestCustomer } from "./helpers";
import { randomUUID } from "crypto";

describe("reward-service", () => {
  let userId: string;
  let profileId: string;
  let rewardId: string;

  beforeEach(async () => {
    const { user, profile } = await createTestCustomer();
    userId = user.id;
    profileId = profile.id;

    const reward = await prisma.reward.create({
      data: { name: `Test Reward ${randomUUID().slice(0, 6)}`, pointsCost: 100, perUserLimit: 1 },
    });
    rewardId = reward.id;
  });

  afterEach(async () => {
    await cleanupTestCustomer(userId);
    await prisma.reward.delete({ where: { id: rewardId } }).catch(() => {});
  });

  it("blocks redemption when the customer doesn't have enough points", async () => {
    await expect(
      prisma.$transaction((tx) => redeemReward(tx, { customerProfileId: profileId, rewardId }))
    ).rejects.toThrow(RewardRedemptionError);

    const redemptions = await prisma.rewardRedemption.count({ where: { customerProfileId: profileId } });
    expect(redemptions).toBe(0);
  });

  it("deducts points and blocks a second redemption once perUserLimit is reached", async () => {
    await awardPoints(
      { customerProfileId: profileId, type: "EARN", source: "PURCHASE", amount: 500, description: "Compra" },
      prisma
    );

    const first = await prisma.$transaction((tx) => redeemReward(tx, { customerProfileId: profileId, rewardId }));
    expect(first.pointsRemaining).toBe(400);

    await expect(
      prisma.$transaction((tx) => redeemReward(tx, { customerProfileId: profileId, rewardId }))
    ).rejects.toMatchObject({ code: "LIMIT_REACHED" });
  });

  it("prevents a redemption code from being marked used twice", async () => {
    await awardPoints(
      { customerProfileId: profileId, type: "EARN", source: "PURCHASE", amount: 500, description: "Compra" },
      prisma
    );
    const { redemptionCode } = await prisma.$transaction((tx) =>
      redeemReward(tx, { customerProfileId: profileId, rewardId })
    );

    const employee = await prisma.user.findFirst({ where: { role: { in: ["EMPLOYEE", "ADMIN", "SUPER_ADMIN"] } } });
    const employeeId = employee?.id ?? userId; // fall back to any user id — only FK validity matters here

    await prisma.$transaction((tx) => markRedemptionUsed(tx, { redemptionCode, employeeId }));

    await expect(
      prisma.$transaction((tx) => markRedemptionUsed(tx, { redemptionCode, employeeId }))
    ).rejects.toMatchObject({ code: "ALREADY_USED" });
  });

  it("rejects an expired redemption code", async () => {
    await awardPoints(
      { customerProfileId: profileId, type: "EARN", source: "PURCHASE", amount: 500, description: "Compra" },
      prisma
    );
    const { redemptionCode } = await prisma.$transaction((tx) =>
      redeemReward(tx, { customerProfileId: profileId, rewardId })
    );
    await prisma.rewardRedemption.update({
      where: { redemptionCode },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await expect(
      prisma.$transaction((tx) => markRedemptionUsed(tx, { redemptionCode, employeeId: userId }))
    ).rejects.toMatchObject({ code: "EXPIRED" });
  });
});
