import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { getReferralStats } from "@/server/services/referral-service";
import { BackHeader } from "@/components/shared/back-header";
import { ShareReferral } from "@/components/customer/share-referral";

export const metadata: Metadata = { title: "Invitá amigos" };

export default async function ReferralsPage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  const stats = await getReferralStats(profile.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 pt-6">
      <BackHeader title="Invitá amigos" />

      <div className="flex flex-col gap-3 rounded-2xl bg-cc-cream-50 p-5">
        <p className="text-sm text-muted-foreground">Compartí Ciocolatto y ganen puntos juntos.</p>
        <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-2.5">
          <span className="font-heading font-semibold tracking-wide text-cc-green-900">{profile.referralCode}</span>
        </div>
        <ShareReferral code={profile.referralCode} appUrl={appUrl} />
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div>
            <p className="font-heading text-lg font-bold text-cc-green-900">{stats.invited}</p>
            <p className="text-xs text-muted-foreground">Invitados</p>
          </div>
          <div>
            <p className="font-heading text-lg font-bold text-cc-green-900">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Compras</p>
          </div>
          <div>
            <p className="font-heading text-lg font-bold text-cc-green-900">{stats.pointsEarned}</p>
            <p className="text-xs text-muted-foreground">Puntos ganados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
