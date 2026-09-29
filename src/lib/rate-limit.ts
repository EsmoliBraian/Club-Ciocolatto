import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;

/**
 * Fails open (never blocks) when Upstash isn't configured or unreachable —
 * a missing/down rate limiter must never be the reason a real customer can't
 * register, log in, or reset their password.
 */
async function withinLimit(limiter: Ratelimit | null, identifier: string): Promise<boolean> {
  if (!limiter) return true;
  try {
    const { success } = await limiter.limit(identifier);
    return success;
  } catch (error) {
    console.error("[rate-limit] check failed, failing open", error);
    return true;
  }
}

// Register/login are keyed by IP (protects against scripted mass signup /
// credential stuffing from one source). Password reset is keyed by the
// *target* email instead (protects one account from being email-bombed by
// repeated reset requests, regardless of which IP sends them).
//
// The register/login limits are deliberately generous, not tight — several
// real customers on the same mobile carrier commonly share one public IP
// via CGNAT (very common in Argentina), especially during a promo push
// (e.g. an Instagram Story) that brings a burst of different people
// registering from the same cell tower within the same hour. A tight limit
// would block real signups, not bots; this still catches an actual script.
const registerLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 h"), prefix: "rl:register", analytics: true })
  : null;
const loginLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "15 m"), prefix: "rl:login", analytics: true })
  : null;
const passwordResetLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "1 h"), prefix: "rl:pwreset", analytics: true })
  : null;

export const RATE_LIMIT_MESSAGE = "Demasiados intentos. Esperá unos minutos y probá de nuevo.";

export const checkRegisterLimit = (identifier: string) => withinLimit(registerLimiter, identifier);
export const checkLoginLimit = (identifier: string) => withinLimit(loginLimiter, identifier);
export const checkPasswordResetLimit = (identifier: string) => withinLimit(passwordResetLimiter, identifier);

/** Best-effort client IP from the headers Vercel's edge network sets. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
