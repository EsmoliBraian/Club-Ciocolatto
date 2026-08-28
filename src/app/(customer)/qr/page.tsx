import type { Metadata } from "next";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Mi QR" };

export default async function QrPage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  const qrDataUrl = await QRCode.toDataURL(profile.qrToken, {
    margin: 1,
    width: 320,
    color: { dark: "#1c4328", light: "#faf3e400" },
  });

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-5 px-4 pt-6 text-center">
      <h1 className="font-heading text-2xl font-semibold">Mi QR</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Mostrá este código en caja para sumar puntos o identificar tu cuenta.
      </p>

      <Card className="w-full max-w-xs border-cc-beige-300">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Tu código QR de Club Ciocolatto" className="size-56" />
          <div>
            <p className="font-heading text-lg font-semibold">
              {profile.user.firstName} {profile.user.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{profile.pointsBalance} puntos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
