import { prisma } from "@/lib/prisma";
import { generateQrToken, buildReferralCodeCandidate } from "@/lib/codes";
import { hashPassword } from "@/lib/password";
import { randomUUID } from "crypto";

/** Creates a throwaway CUSTOMER user + profile for a test. Caller must delete via cleanupTestCustomer. */
export async function createTestCustomer(overrides: { tierId?: string } = {}) {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      email: `test-${suffix}@example.com`,
      phone: `+549test${suffix}`,
      passwordHash: await hashPassword("Test1234!"),
      role: "CUSTOMER",
      firstName: "Test",
      lastName: suffix,
    },
  });
  const profile = await prisma.customerProfile.create({
    data: {
      userId: user.id,
      referralCode: buildReferralCodeCandidate(`Test${suffix}`),
      qrToken: generateQrToken(),
      tierId: overrides.tierId,
    },
  });
  return { user, profile };
}

export async function cleanupTestCustomer(userId: string) {
  const profile = await prisma.customerProfile.findUnique({ where: { userId } });
  if (profile) {
    await prisma.orderItem.deleteMany({ where: { order: { customerProfileId: profile.id } } });
    await prisma.order.deleteMany({ where: { customerProfileId: profile.id } });
    await prisma.pointTransaction.deleteMany({ where: { customerProfileId: profile.id } });
    await prisma.rewardRedemption.deleteMany({ where: { customerProfileId: profile.id } });
    await prisma.missionProgress.deleteMany({ where: { customerProfileId: profile.id } });
    await prisma.referral.deleteMany({
      where: { OR: [{ referrerId: profile.id }, { refereeId: profile.id }] },
    });
  }
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
}

/**
 * Test-only tiers at a high point offset (10,000+) so their thresholds never
 * collide with whatever real tiers `prisma/seed.ts` may have created —
 * `resolveTierForPoints` reads *all* active tiers, real and test alike.
 */
export async function ensureTestTiers() {
  const [below, above] = await Promise.all([
    prisma.loyaltyTier.upsert({
      where: { slug: "test-below" },
      update: {},
      create: {
        name: "Test Below",
        slug: "test-below",
        minimumPoints: 10_000,
        maximumPoints: 10_199,
        benefits: [],
        displayOrder: 101,
      },
    }),
    prisma.loyaltyTier.upsert({
      where: { slug: "test-above" },
      update: {},
      create: {
        name: "Test Above",
        slug: "test-above",
        minimumPoints: 10_200,
        maximumPoints: null,
        benefits: [],
        displayOrder: 102,
      },
    }),
  ]);
  return { below, above };
}
