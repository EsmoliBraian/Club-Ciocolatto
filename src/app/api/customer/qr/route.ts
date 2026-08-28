import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") {
    return new Response("Unauthorized", { status: 401 });
  }

  const profile = await getCustomerProfileByUserId(session.user.id);
  if (!profile) return new Response("Not found", { status: 404 });

  const png = await QRCode.toBuffer(profile.qrToken, {
    margin: 1,
    width: 320,
    color: { dark: "#1c4328", light: "#00000000" },
  });

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store" },
  });
}
