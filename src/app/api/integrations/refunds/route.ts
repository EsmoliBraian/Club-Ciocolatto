import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, hasScope, verifySignatureIfPresent } from "@/lib/api-auth";
import { withIdempotency } from "@/lib/idempotency";
import { integrationRefundSchema } from "@/schemas/integrations";
import { refundOrder, OrderServiceError } from "@/server/services/order-service";

export async function POST(request: Request) {
  const apiKey = await authenticateApiKey(request);
  if (!apiKey || !hasScope(apiKey, "refunds:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();
  if (!verifySignatureIfPresent(request, rawBody)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsed = integrationRefundSchema.safeParse(JSON.parse(rawBody || "{}"));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const result = await withIdempotency(request, "/api/integrations/refunds", async () => {
    const order = await prisma.order.findUnique({ where: { externalReference: input.externalReference } });
    if (!order) return { status: 404, body: { error: "Order not found" } };

    try {
      const refunded = await refundOrder(order.id, { reason: input.reason });
      return { status: 200, body: { orderId: refunded.id, status: refunded.status } };
    } catch (error) {
      if (error instanceof OrderServiceError) {
        return { status: 422, body: { error: error.message } };
      }
      throw error;
    }
  });

  return NextResponse.json(result.body, { status: result.status });
}
