import { randomBytes } from "crypto";

const UNAMBIGUOUS_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function randomFromAlphabet(length: number, alphabet: string): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/** Human-shareable personal referral code, e.g. "BRAIAN50". */
export function buildReferralCodeCandidate(firstName: string): string {
  const base = firstName
    .normalize("NFD")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 8);
  const suffix = randomFromAlphabet(2, "0123456789");
  return `${base || "CLUB"}${suffix}`;
}

/**
 * Opaque, cryptographically random identifier embedded in the customer's QR.
 * Carries no personal data — the employee scanner resolves it server-side via
 * CustomerProfile.qrToken lookup.
 */
export function generateQrToken(): string {
  return randomBytes(20).toString("base64url");
}

/** Code shown/scanned at redemption time (e.g. printed at the register). */
export function generateRedemptionCode(): string {
  return randomFromAlphabet(8, UNAMBIGUOUS_ALPHABET);
}

/** Prefix shown in the admin UI so an API key can be identified without exposing it. */
export function generateApiKey(): { plaintext: string; prefix: string } {
  const secret = randomBytes(32).toString("base64url");
  const plaintext = `cc_live_${secret}`;
  const prefix = plaintext.slice(0, 12);
  return { plaintext, prefix };
}
