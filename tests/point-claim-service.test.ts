import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { submitPointClaim, approvePointClaim, rejectPointClaim, PointClaimError } from "@/server/services/point-claim-service";
import { createTestCustomer, cleanupTestCustomer } from "./helpers";

describe("point-claim-service", () => {
  let userId: string;
  let profileId: string;
  let reviewerId: string;

  beforeEach(async () => {
    const { user, profile } = await createTestCustomer();
    userId = user.id;
    profileId = profile.id;
    const reviewer = await prisma.user.findFirst({ where: { role: { in: ["EMPLOYEE", "ADMIN", "SUPER_ADMIN"] } } });
    reviewerId = reviewer?.id ?? userId;
  });

  afterEach(async () => {
    await cleanupTestCustomer(userId);
  });

  it("approving a claim awards exactly the specified points and marks it APPROVED", async () => {
    const claim = await submitPointClaim({ customerProfileId: profileId, type: "REVIEW", description: "Dejé una reseña" });
    expect(claim.status).toBe("PENDING");

    await prisma.$transaction((tx) => approvePointClaim(tx, claim.id, { reviewerId, pointsAwarded: 75 }));

    const updated = await prisma.pointClaim.findUniqueOrThrow({ where: { id: claim.id } });
    expect(updated.status).toBe("APPROVED");
    expect(updated.pointsAwarded).toBe(75);

    const tx = await prisma.pointTransaction.findMany({ where: { customerProfileId: profileId, source: "CLAIM_APPROVED" } });
    expect(tx).toHaveLength(1);
    expect(tx[0].amount).toBe(75);

    const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.pointsBalance).toBe(75);
  });

  it("refuses to approve or reject a claim that was already reviewed", async () => {
    const claim = await submitPointClaim({ customerProfileId: profileId, type: "SOCIAL_MEDIA_POST" });
    await prisma.$transaction((tx) => rejectPointClaim(tx, claim.id, { reviewerId }));

    await expect(
      prisma.$transaction((tx) => approvePointClaim(tx, claim.id, { reviewerId, pointsAwarded: 50 }))
    ).rejects.toThrow(PointClaimError);

    const tx = await prisma.pointTransaction.findMany({ where: { customerProfileId: profileId, source: "CLAIM_APPROVED" } });
    expect(tx).toHaveLength(0); // the second (failed) approve attempt must not have paid anything
  });
});
