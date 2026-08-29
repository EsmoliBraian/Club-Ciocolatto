import { Resend } from "resend";

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "Club Ciocolatto <onboarding@resend.dev>";

let client: Resend | null = null;
function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Best-effort email send — never throws. Missing RESEND_API_KEY (e.g. local
 * dev without it configured) logs and no-ops instead of breaking the caller,
 * since email delivery must never fail a registration, password reset, or
 * birthday job.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const resend = getClient();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipped email to ${input.to}: "${input.subject}"`);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    if (error) console.error("[email] Resend error", error);
  } catch (error) {
    console.error("[email] send failed", error);
  }
}

const EMAIL_WRAPPER = (title: string, bodyHtml: string) => `
<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#F7F6F0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #E8E7DF;">
            <tr>
              <td style="background:#1C4328;padding:24px 28px;">
                <span style="font-size:20px;font-weight:600;color:#E2C98D;font-style:italic;">Ciocolatto</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 12px;font-size:20px;color:#1E2822;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export function genericEmailHtml(title: string, bodyText: string): string {
  return EMAIL_WRAPPER(
    title,
    `<p style="margin:0;color:#6F776F;font-size:14px;line-height:1.5;">${bodyText}</p>`
  );
}

export function passwordResetEmailHtml(params: { firstName: string; resetUrl: string }): string {
  return EMAIL_WRAPPER(
    "Restablecé tu contraseña",
    `
    <p style="margin:0 0 16px;color:#6F776F;font-size:14px;line-height:1.5;">
      Hola ${params.firstName}, recibimos un pedido para restablecer la contraseña de tu cuenta del Club Ciocolatto.
    </p>
    <p style="margin:0 0 24px;">
      <a href="${params.resetUrl}" style="display:inline-block;background:#1C4328;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
        Elegir nueva contraseña
      </a>
    </p>
    <p style="margin:0;color:#6F776F;font-size:12px;line-height:1.5;">
      Este link vence en 1 hora. Si no pediste este cambio, podés ignorar este mensaje.
    </p>
    `
  );
}

export function birthdayEmailHtml(params: { firstName: string; drink: string; appUrl: string }): string {
  return EMAIL_WRAPPER(
    "¡Feliz cumpleaños! 🎂",
    `
    <p style="margin:0 0 16px;color:#6F776F;font-size:14px;line-height:1.5;">
      ${params.firstName}, todo el equipo de Ciocolatto te desea un día espectacular. Como regalo, tenés
      tu <strong style="color:#1E2822;">${params.drink}</strong> gratis esperándote esta semana.
    </p>
    <p style="margin:0;">
      <a href="${params.appUrl}/inicio" style="display:inline-block;background:#1C4328;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
        Reclamar mi regalo
      </a>
    </p>
    `
  );
}
