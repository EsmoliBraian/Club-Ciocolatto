import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email";

export class PasswordResetError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Always resolves without revealing whether the email exists (avoids account
 * enumeration) — the caller shows the same message either way. Sends nothing
 * when there's no matching account.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !user.active) return;

  const rawToken = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://club-ciocolatto.vercel.app";
  const resetUrl = `${appUrl}/restablecer-password?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: "Restablecé tu contraseña — Club Ciocolatto",
    html: passwordResetEmailHtml({ firstName: user.firstName, resetUrl }),
  });
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new PasswordResetError("INVALID_TOKEN", "Este link ya no es válido. Pedí uno nuevo.");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
}
