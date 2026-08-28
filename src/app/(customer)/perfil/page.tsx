import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, UserCog, Receipt, Star, Gift as GiftIcon, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutMenuRow } from "@/components/shared/logout-menu-row";

export const metadata: Metadata = { title: "Perfil" };

const MENU = [
  { href: "/perfil/datos", label: "Mis datos", icon: UserCog },
  { href: "/perfil/compras", label: "Historial de compras", icon: Receipt },
  { href: "/perfil/puntos", label: "Mis puntos", icon: Star },
  { href: "/perfil/beneficios", label: "Mis beneficios", icon: GiftIcon },
  { href: "/perfil/referidos", label: "Invitá amigos", icon: Users },
];

export default async function ProfilePage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  const initials = `${profile.user.firstName[0]}${profile.user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 pt-6">
      <h1 className="font-heading text-xl font-semibold text-cc-cream-50">Mi perfil</h1>

      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="bg-cc-gold-400 font-heading text-xl text-cc-green-900">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-heading text-lg font-semibold text-cc-cream-50">
            {profile.user.firstName} {profile.user.lastName}
          </p>
          <p className="text-sm text-cc-cream-200">{profile.user.email}</p>
          <p className="mt-0.5 text-xs font-medium text-cc-gold-300">
            {profile.tier?.icon} {profile.tier?.name ?? "Amigo Ciocolatto"}
          </p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl bg-cc-cream-50">
        {MENU.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-cc-green-900 hover:bg-secondary/50"
          >
            <item.icon className="size-4 text-muted-foreground" />
            <span className="flex-1">
              {item.label}
              {item.href === "/perfil/puntos" && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {profile.pointsBalance} pts
                </span>
              )}
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
        <LogoutMenuRow />
      </div>
    </div>
  );
}
