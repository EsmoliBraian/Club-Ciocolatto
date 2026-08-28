import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, hasScope, verifySignatureIfPresent } from "@/lib/api-auth";
import { withIdempotency } from "@/lib/idempotency";
import { integrationOrderSchema } from "@/schemas/integrations";
import { registerOrder, OrderServiceError } from "@/server/services/order-service";

export async function POST(request: Request) {
  const apiKey = await authenticateApiKey(request);
  if (!apiKey || !hasScope(apiKey, "orders:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();
  if (!verifySignatureIfPresent(request, rawBody)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsed = integrationOrderSchema.safeParse(JSON.parse(rawBody || "{}"));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const result = await withIdempotency(request, "/api/integrations/orders", async () => {
    const profile = await prisma.customerProfile.findFirst({
      where: {
        OR: [
          ...(input.customer.qrToken ? [{ qrToken: input.customer.qrToken }] : []),
          ...(input.customer.email ? [{ user: { email: input.customer.email } }] : []),
          ...(input.customer.phone ? [{ user: { phone: input.customer.phone } }] : []),
        ],
      },
    });
    if (!profile) {
      return { status: 404, body: { error: "Customer not found" } };
    }

    const skus = input.items?.map((i) => i.externalSku).filter((sku): sku is string => !!sku) ?? [];
    const products = skus.length
      ? await prisma.product.findMany({ where: { externalSku: { in: skus } } })
      : [];

    try {
      const order = await registerOrder({
        customerProfileId: profile.id,
        source: "POS_INTEGRATION",
        totalAmount: input.totalAmount,
        paymentMethod: input.paymentMethod,
        externalReference: input.externalReference,
        notes: input.notes,
        items: input.items?.map((i) => ({
          productId: products.find((p) => p.externalSku === i.externalSku)?.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });
      return { status: 201, body: order };
    } catch (error) {
      if (error instanceof OrderServiceError) {
        return { status: 422, body: { error: error.message } };
      }
      throw error;
    }
  });

  return NextResponse.json(result.body, { status: result.status });
}
