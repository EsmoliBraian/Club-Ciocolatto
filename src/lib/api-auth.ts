import { createHash, timingSafeEqual, createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export interface AuthenticatedApiKey {
  id: string;
  scopes: string[];
}

/** Verifies the `Authorization: Bearer <key>` (or `x-api-key`) header against stored ApiKey hashes. */
export async function authenticateApiKey(request: Request): Promise<AuthenticatedApiKey | null> {
  const authHeader = request.headers.get("authorization");
  const rawKey = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : (request.headers.get("x-api-key") ?? undefined);
  if (!rawKey) return null;

  const hashedKey = hashApiKey(rawKey);
  const apiKey = await prisma.apiKey.findUnique({ where: { hashedKey } });
  if (!apiKey || !apiKey.active) return null;

  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
  return { id: apiKey.id, scopes: apiKey.scopes as string[] };
}

export function hasScope(apiKey: AuthenticatedApiKey, scope: string): boolean {
  return apiKey.scopes.includes(scope) || apiKey.scopes.includes("*");
}

/**
 * Optional extra layer: if the caller sends `X-Signature`, it must be a valid
 * HMAC-SHA256 (hex) of the raw request body under POS_WEBHOOK_SECRET. Callers
 * that omit the header rely on the API key alone — the header is additive,
 * not required, so existing integrations aren't broken by adding it later.
 */
export function verifySignatureIfPresent(request: Request, rawBody: string): boolean {
  const signature = request.headers.get("x-signature");
  if (!signature) return true;
  const secret = process.env.POS_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
