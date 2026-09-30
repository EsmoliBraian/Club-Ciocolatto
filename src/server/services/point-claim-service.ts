import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import type { PointClaimType } from "@prisma/client";
import { awardPoints } from "@/server/services/loyalty-service";
import { notify } from "@/server/services/notification-service";
import { POINT_CLAIM_SUGGESTED_POINTS } from "@/lib/constants";

export class PointClaimError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function submitPointClaim(params: {
  customerProfileId: string;
  type: PointClaimType;
  description?: string;
  proofUrl?: string;
}) {
  return prisma.pointClaim.create({
    data: {
      customerProfileId: params.customerProfileId,
      type: params.type,
      description: params.description,
      proofUrl: params.proofUrl,
      pointsRequested: POINT_CLAIM_SUGGESTED_POINTS[params.type],
    },
  });
}

export async function listClaimsForCustomer(customerProfileId: string, db: Db = prisma) {
  return db.pointClaim.findMany({
    where: { customerProfileId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function countPendingClaims(db: Db = prisma) {
  return db.pointClaim.count({ where: { status: "PENDING" } });
}

export async function listPendingClaims(db: Db = prisma) {
  return db.pointClaim.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { customerProfile: { include: { user: true } } },
  });
}

/** Must run inside `prisma.$transaction` — call sites wrap this. */
export async function approvePointClaim(
  db: Db,
  claimId: string,
  params: { reviewerId: string; pointsAwarded: number; reviewNote?: string }
) {
  const claim = await db.pointClaim.findUniqueOrThrow({ where: { id: claimId }, include: { customerProfile: true } });
  if (claim.status !== "PENDING") {
    throw new PointClaimError("ALREADY_REVIEWED", "Esta solicitud ya fue revisada.");
  }

  await db.pointClaim.update({
    where: { id: claimId },
    data: {
      status: "APPROVED",
      pointsAwarded: params.pointsAwarded,
      reviewedById: params.reviewerId,
      reviewNote: params.reviewNote,
      reviewedAt: new Date(),
    },
  });

  if (params.pointsAwarded > 0) {
    await awardPoints(
      {
        customerProfileId: claim.customerProfileId,
        type: "EARN",
        source: "CLAIM_APPROVED",
        amount: params.pointsAwarded,
        description: "Solicitud aprobada 🙌",
        referenceType: "PointClaim",
        referenceId: claim.id,
        silent: true,
      },
      db
    );
  }

  await notify(
    {
      userId: claim.customerProfile.userId,
      type: "GENERAL",
      title: "Tu solicitud fue aprobada 🎉",
      body: `Sumaste ${params.pointsAwarded} puntos.`,
    },
    db
  );

  return claim;
}

/** Must run inside `prisma.$transaction` — call sites wrap this. */
export async function rejectPointClaim(db: Db, claimId: string, params: { reviewerId: string; reviewNote?: string }) {
  const claim = await db.pointClaim.findUniqueOrThrow({ where: { id: claimId }, include: { customerProfile: true } });
  if (claim.status !== "PENDING") {
    throw new PointClaimError("ALREADY_REVIEWED", "Esta solicitud ya fue revisada.");
  }

  await db.pointClaim.update({
    where: { id: claimId },
    data: { status: "REJECTED", reviewedById: params.reviewerId, reviewNote: params.reviewNote, reviewedAt: new Date() },
  });

  await notify(
    {
      userId: claim.customerProfile.userId,
      type: "GENERAL",
      title: "Tu solicitud no fue aprobada",
      body: params.reviewNote ?? "Contactanos si creés que es un error.",
    },
    db
  );

  return claim;
}
