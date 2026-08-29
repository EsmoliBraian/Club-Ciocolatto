import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { createTestCustomer, cleanupTestCustomer } from "./helpers";
import { redeemReward, grantFreeReward } from "@/server/services/reward-service";
import { BIRTHDAY_COFFEE_REWARD_ID } from "@/lib/constants";

// validateRedemptionAction records employeeId on the redemption row (a real
// FK to User), so the mocked session must point at a real employee user —
// not just any string id.
let employeeId = "";
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: employeeId, role: "EMPLOYEE" } })),
}));

const { validateRedemptionAction } = await import("@/actions/employee-actions");

beforeAll(async () => {
  const suffix = randomUUID().slice(0, 8);
  const employee = await prisma.user.create({
    data: {
      email: `test-employee-${suffix}@example.com`,
      phone: `+549employee${suffix}`,
      passwordHash: "irrelevant",
      role: "EMPLOYEE",
      firstName: "Test",
      lastName: "Employee",
    },
  });
  employeeId = employee.id;
});

afterAll(async () => {
  if (employeeId) await prisma.user.delete({ where: { id: employeeId } }).catch(() => {});
});

describe("employee-actions: validateRedemptionAction", () => {
  it(
    "does not surface the customer's favorite drink for a regular reward " +
      "— regression: redeeming \"Café americano\" said 'Preparar: Latte' " +
      "because favoriteDrink was echoed back for every redemption, not just the birthday coffee",
    async () => {
      const { user, profile } = await createTestCustomer();
      try {
        await prisma.user.update({ where: { id: user.id }, data: { favoriteDrink: "Latte" } });
        await prisma.customerProfile.update({ where: { id: profile.id }, data: { pointsBalance: 1000 } });

        const cafe = await prisma.reward.findUniqueOrThrow({ where: { id: "seed-reward-cafe" } });
        const redemption = await prisma.$transaction((tx) =>
          redeemReward(tx, { customerProfileId: profile.id, rewardId: cafe.id })
        );

        const formData = new FormData();
        formData.set("code", redemption.redemptionCode);
        const result = await validateRedemptionAction({}, formData);

        expect(result.success).toBe(true);
        expect(result.rewardName).toBe(cafe.name);
        expect(result.favoriteDrink).toBeUndefined();
      } finally {
        await prisma.rewardRedemption.deleteMany({ where: { customerProfileId: profile.id } });
        await cleanupTestCustomer(user.id);
      }
    }
  );

  it("surfaces the favorite drink for the birthday coffee reward specifically", async () => {
    const { user, profile } = await createTestCustomer();
    try {
      await prisma.user.update({ where: { id: user.id }, data: { favoriteDrink: "Cappuccino" } });

      const redemption = await prisma.$transaction((tx) =>
        grantFreeReward(tx, {
          customerProfileId: profile.id,
          rewardId: BIRTHDAY_COFFEE_REWARD_ID,
          notificationTitle: "test",
          notificationBody: "test",
        })
      );

      const formData = new FormData();
      formData.set("code", redemption.redemptionCode);
      const result = await validateRedemptionAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.favoriteDrink).toBe("Cappuccino");
    } finally {
      await prisma.rewardRedemption.deleteMany({ where: { customerProfileId: profile.id } });
      await cleanupTestCustomer(user.id);
    }
  });
});
