import { describe, it, expect } from "vitest";
import { checkRegisterLimit, checkLoginLimit, checkPasswordResetLimit } from "@/lib/rate-limit";

// The local/test environment has no UPSTASH_REDIS_REST_URL/TOKEN set (only
// production does) — this exercises the exact "Upstash isn't configured"
// fail-open path for real, not a mock: a missing/misconfigured rate limiter
// must never be the reason a real customer can't register, log in, or
// reset their password.
describe("rate-limit: fails open when Upstash isn't configured", () => {
  it("checkRegisterLimit always allows", async () => {
    for (let i = 0; i < 10; i++) {
      expect(await checkRegisterLimit("test-ip")).toBe(true);
    }
  });

  it("checkLoginLimit always allows", async () => {
    for (let i = 0; i < 20; i++) {
      expect(await checkLoginLimit("test-ip")).toBe(true);
    }
  });

  it("checkPasswordResetLimit always allows", async () => {
    for (let i = 0; i < 5; i++) {
      expect(await checkPasswordResetLimit("test@example.com")).toBe(true);
    }
  });
});
