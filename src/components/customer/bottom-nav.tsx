"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, QrCode, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/misiones", label: "Misiones", icon: Trophy },
  { href: "/qr", label: "Mi QR", icon: QrCode },
  { href: "/canjear", label: "Canjear", icon: Gift },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom sticky bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur sm:hidden">
      <ul className="flex items-stretch justify-between">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("size-5", active && "fill-primary/15")} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden border-b border-border bg-card sm:block">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
        <Link href="/inicio" className="font-heading text-lg font-semibold text-cc-green-800">
          Club Ciocolatto
        </Link>
        <ul className="flex items-center gap-1">
          {ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
