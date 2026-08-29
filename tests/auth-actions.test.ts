import { describe, it, expect, vi } from "vitest";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { cleanupTestCustomer } from "./helpers";

// auth-actions.ts calls signIn() after a successful registration, which pulls
// in next-auth's full runtime (next/server etc.) — unavailable outside a real
// Next.js request in Vitest. Mocked out since this test only cares about
// validation + account creation, not the sign-in redirect that follows.
vi.mock("@/lib/auth", () => ({
  signIn: vi.fn().mockRejectedValue(new Error("mocked: signIn unavailable in tests")),
  signOut: vi.fn(),
}));
vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {},
}));

const { registerAction } = await import("@/actions/auth-actions");

describe("auth-actions: registerAction", () => {
  it("parses every field the real registration form submits — regression: favoriteDrink was silently dropped from the parse call, failing every signup with \"Elegí tu bebida favorita\" regardless of the form", async () => {
    const suffix = randomUUID().slice(0, 8);
    const email = `register-action-${suffix}@example.com`;

    // Field names/values exactly as RegisterForm (src/components/shared/register-form.tsx) submits.
    const formData = new FormData();
    formData.set("firstName", "Test");
    formData.set("lastName", suffix);
    formData.set("email", email);
    formData.set("phone", `+549action${suffix}`);
    formData.set("password", "Test1234!");
    formData.set("birthDate", "1995-01-01");
    formData.set("favoriteDrink", "Latte");
    formData.set("acceptedTerms", "on");
    formData.set("acceptedMarketing", "on");
    formData.set("referralCode", "");

    let result: Awaited<ReturnType<typeof registerAction>> | undefined;
    try {
      result = await registerAction({}, formData);
    } catch {
      // registerAction calls signIn() (→ redirect()) once the account is created —
      // outside a real Next.js request that throws here, which is expected and fine:
      // it only happens *after* validation + registerCustomer already succeeded.
    }

    if (result) {
      expect(result.fieldErrors).toBeUndefined();
      expect(result.error).toBeUndefined();
    }

    // The real signal: validation must have let registerCustomer run at all.
    const created = await prisma.user.findUnique({ where: { email } });
    expect(created).not.toBeNull();
    expect(created?.favoriteDrink).toBe("Latte");

    if (created) await cleanupTestCustomer(created.id);
  });
});
