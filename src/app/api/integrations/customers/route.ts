import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, hasScope, verifySignatureIfPresent } from "@/lib/api-auth";
import { withIdempotency } from "@/lib/idempotency";
import { integrationCustomerSchema } from "@/schemas/integrations";
import { hashPassword } from "@/lib/password";
import { generateUniqueReferralCode, generateUniqueQrToken } from "@/server/services/customer-service";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
  const apiKey = await authenticateApiKey(request);
  if (!apiKey || !hasScope(apiKey, "customers:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.toLowerCase();
  const phone = searchParams.get("phone");
  const qrToken = searchParams.get("qrToken");
  if (!email && !phone && !qrToken) {
    return NextResponse.json({ error: "Provide email, phone or qrToken" }, { status: 400 });
  }

  const profile = await prisma.customerProfile.findFirst({
    where: {
      OR: [
        ...(qrToken ? [{ qrToken }] : []),
        ...(email ? [{ user: { email } }] : []),
        ...(phone ? [{ user: { phone } }] : []),
      ],
    },
    include: { user: true, tier: true },
  });
  if (!profile) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  return NextResponse.json({
    customerId: profile.id,
    firstName: profile.user.firstName,
    lastName: profile.user.lastName,
    email: profile.user.email,
    phone: profile.user.phone,
    tier: profile.tier?.name ?? null,
    pointsBalance: profile.pointsBalance,
  });
}

export async function POST(request: Request) {
  const apiKey = await authenticateApiKey(request);
  if (!apiKey || !hasScope(apiKey, "customers:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();
  if (!verifySignatureIfPresent(request, rawBody)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsed = integrationCustomerSchema.safeParse(JSON.parse(rawBody || "{}"));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const result = await withIdempotency(request, "/api/integrations/customers", async () => {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, ...(input.phone ? [{ phone: input.phone }] : [])] },
      include: { customerProfile: true },
    });
    if (existingUser?.customerProfile) {
      return {
        status: 200,
        body: {
          customerId: existingUser.customerProfile.id,
          existed: true,
          qrToken: existingUser.customerProfile.qrToken,
        },
      };
    }

    // POS-originated accounts get a random password — the customer sets a real one
    // the first time they log in via "forgot password" (email delivery is not wired
    // up yet; see docs/api.md for the follow-up needed before this path is used live).
    const passwordHash = await hashPassword(randomBytes(24).toString("hex"));

    const { user, profile } = await prisma.$transaction(async (tx) => {
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
        },
      });
      const profile = await tx.customerProfile.create({
        data: { userId: user.id, referralCode, qrToken },
      });
      return { user, profile };
    });

    return { status: 201, body: { customerId: profile.id, existed: false, qrToken: profile.qrToken, userId: user.id } };
  });

  return NextResponse.json(result.body, { status: result.status });
}
