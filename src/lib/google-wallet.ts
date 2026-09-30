import jwt from "jsonwebtoken";
import type { CustomerProfile, LoyaltyTier, User } from "@prisma/client";

/**
 * Builds a "Save to Google Wallet" link for a customer's loyalty card. The
 * full loyalty object is embedded directly in the signed JWT payload (the
 * JWT-embedded-object flow) — Google creates the pass from it on first tap,
 * so no separate Wallet REST API call is needed. Real-time balance push-
 * updates to an already-saved pass would need that separate REST call with
 * an OAuth2 token — deferred as a later improvement, not built here.
 *
 * Returns null (never throws) when the required env vars aren't set, so
 * callers can hide the button entirely — same "fail open, don't break the
 * page" philosophy as sendEmail() when RESEND_API_KEY is missing. Server-only:
 * GOOGLE_WALLET_PRIVATE_KEY must never reach the client.
 */
export function buildSaveToWalletUrl(
  profile: CustomerProfile & { user: User },
  tier: LoyaltyTier | null
): string | null {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const classId = process.env.GOOGLE_WALLET_CLASS_ID;
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!issuerId || !classId || !serviceAccountEmail || !privateKey || !appUrl) return null;

  const loyaltyObject = {
    id: `${issuerId}.${profile.id}`,
    classId,
    state: "ACTIVE",
    accountName: `${profile.user.firstName} ${profile.user.lastName}`,
    accountId: profile.referralCode,
    loyaltyPoints: { balance: { string: String(profile.pointsBalance) }, label: "Puntos" },
    barcode: { type: "QR_CODE", value: profile.qrToken },
    textModulesData: [{ header: "Nivel", body: tier?.name ?? "Amigo Ciocolatto" }],
  };

  const payload = {
    iss: serviceAccountEmail,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [appUrl],
    payload: { loyaltyObjects: [loyaltyObject] },
  };

  // Private keys from env vars commonly have literal "\n" sequences instead
  // of real newlines (how most hosts store multi-line secrets) — restore them.
  const token = jwt.sign(payload, privateKey.replace(/\\n/g, "\n"), { algorithm: "RS256" });
  return `https://pay.google.com/gp/v/save/${token}`;
}
