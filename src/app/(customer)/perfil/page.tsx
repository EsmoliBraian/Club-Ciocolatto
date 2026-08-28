import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Receipt, Star, Gift as GiftIcon, Users, Settings } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { getReferralStats } from "@/server/services/referral-service";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/shared/logout-button";
import { ShareReferral } from "@/components/customer/share-referral";

export const metadata: Metadata = { title: "Perfil" };

const MENU = [
  { href: "/perfil/puntos", label: "Historial de puntos", icon: Star },
  { href: "/perfil/compras", label: "Historial de compras", icon: Receipt },
  { href: "/perfil/beneficios", label: "Mis beneficios", icon: GiftIcon },
  { href: "/misiones", label: "Mis misiones", icon: Settings },
];

export default async function ProfilePage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  const stats = await getReferralStats(profile.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const initials = `${profile.user.firstName[0]}${profile.user.lastName[0]}`.toUpperCase();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 pt-6">
      <h1 className="font-heading text-2xl font-semibold">Mi perfil</h1>

      <Card>
        <CardContent className="flex items-center gap-4 py-5">
          <Avatar className="size-14">
            <AvatarFallback className="bg-cc-green-800 text-cc-cream-50 font-heading text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-heading text-lg font-semibold leading-tight">
              {profile.user.firstName} {profile.user.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{profile.user.email}</p>
            {profile.user.phone && <p className="text-sm text-muted-foreground">{profile.user.phone}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-4 text-center">
            <span className="text-lg">{profile.tier?.icon ?? "🥉"}</span>
            <p className="text-sm font-medium">{profile.tier?.name ?? "Amigo Ciocolatto"}</p>
            <p className="text-xs text-muted-foreground">Tu nivel</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-4 text-center">
            <p className="font-heading text-xl font-bold text-cc-gold-400">{profile.pointsBalance}</p>
            <p className="text-xs text-muted-foreground">Puntos disponibles</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-0 divide-y divide-border p-0">
          {MENU.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium hover:bg-secondary/50"
            >
              <item.icon className="size-4 text-muted-foreground" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 py-5">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <p className="font-heading text-sm font-semibold">Invitá a tus amigos</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Compartí Ciocolatto y ganen puntos juntos.
          </p>
          <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-2.5">
            <span className="font-heading font-semibold tracking-wide">{profile.referralCode}</span>
          </div>
          <ShareReferral code={profile.referralCode} appUrl={appUrl} />
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div>
              <p className="font-heading text-lg font-bold">{stats.invited}</p>
              <p className="text-xs text-muted-foreground">Invitados</p>
            </div>
            <div>
              <p className="font-heading text-lg font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Compras</p>
            </div>
            <div>
              <p className="font-heading text-lg font-bold">{stats.pointsEarned}</p>
              <p className="text-xs text-muted-foreground">Puntos ganados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <LogoutButton />
    </div>
  );
}
