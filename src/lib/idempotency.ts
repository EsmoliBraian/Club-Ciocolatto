import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Generic idempotency for integration endpoints, keyed by the caller-supplied
 * `Idempotency-Key` header. Order registration additionally enforces
 * idempotency at the domain level via `Order.externalReference` — this layer
 * covers endpoints (like refunds) that have no such natural unique key.
 */
export async function withIdempotency(
  request: Request,
  endpoint: string,
  handler: () => Promise<{ status: number; body: unknown }>
): Promise<{ status: number; body: unknown }> {
  const key = request.headers.get("idempotency-key");
  if (!key) return handler();

  const existing = await prisma.idempotencyKey.findUnique({ where: { key } });
  if (existing) {
    return { status: existing.statusCode ?? 200, body: existing.responseBody };
  }

  const result = await handler();

  await prisma.idempotencyKey.create({
    data: {
      key,
      endpoint,
      statusCode: result.status,
      responseBody: result.body as Prisma.InputJsonValue,
    },
  });

  return result;
}
