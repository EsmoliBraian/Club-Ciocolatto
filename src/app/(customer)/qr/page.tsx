import type { Metadata } from "next";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";

export const metadata: Metadata = { title: "Mi QR" };

export default async function QrPage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  const qrDataUrl = await QRCode.toDataURL(profile.qrToken, {
    margin: 1,
    width: 320,
    color: { dark: "#1c4328", light: "#00000000" },
  });

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 pt-10 text-center">
      <div>
        <h1 className="font-heading text-xl font-semibold text-cc-cream-50">Pagá y sumá puntos</h1>
        <p className="mx-auto mt-1 max-w-xs text-sm text-cc-cream-200">
          Mostrá este código en caja para escanear y sumar puntos por tu compra.
        </p>
      </div>

      <div className="w-full max-w-xs rounded-3xl bg-cc-cream-50 p-6 shadow-[0_12px_32px_rgba(18,40,26,0.3)]">
        <div className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Tu código QR de Club Ciocolatto" className="size-56 rounded-xl" />
          <div>
            <p className="font-heading text-lg font-semibold text-cc-green-900">
              {profile.user.firstName} {profile.user.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{profile.pointsBalance} puntos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
