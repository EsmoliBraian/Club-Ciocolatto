import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generateKeyPairSync } from "crypto";
import jwt from "jsonwebtoken";
import { buildSaveToWalletUrl } from "@/lib/google-wallet";
import type { CustomerProfile, User } from "@prisma/client";

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const fakeProfile = {
  id: "profile-test-id",
  referralCode: "TESTCODE1",
  pointsBalance: 250,
  qrToken: "qr-token-test-value",
  user: { firstName: "Ana", lastName: "Gómez" } as User,
} as CustomerProfile & { user: User };

describe("buildSaveToWalletUrl", () => {
  beforeEach(() => {
    vi.stubEnv("GOOGLE_WALLET_ISSUER_ID", "3388000000000000000");
    vi.stubEnv("GOOGLE_WALLET_CLASS_ID", "3388000000000000000.club-ciocolatto");
    vi.stubEnv("GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL", "test@test.iam.gserviceaccount.com");
    vi.stubEnv("GOOGLE_WALLET_PRIVATE_KEY", privateKey);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://clubciocolatto.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a signed, verifiable save-to-wallet URL embedding the customer's QR token", () => {
    const url = buildSaveToWalletUrl(fakeProfile, null);
    expect(url).not.toBeNull();
    expect(url).toMatch(/^https:\/\/pay\.google\.com\/gp\/v\/save\//);

    const token = url!.replace("https://pay.google.com/gp/v/save/", "");
    const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as jwt.JwtPayload & {
      payload: { loyaltyObjects: [{ barcode: { value: string }; accountName: string }] };
    };

    expect(decoded.iss).toBe("test@test.iam.gserviceaccount.com");
    expect(decoded.typ).toBe("savetowallet");
    const loyaltyObject = decoded.payload.loyaltyObjects[0];
    expect(loyaltyObject.barcode.value).toBe(fakeProfile.qrToken);
    expect(loyaltyObject.accountName).toBe("Ana Gómez");
  });

  it("returns null when a required env var is missing, instead of throwing", () => {
    vi.stubEnv("GOOGLE_WALLET_PRIVATE_KEY", "");
    const url = buildSaveToWalletUrl(fakeProfile, null);
    expect(url).toBeNull();
  });
});
