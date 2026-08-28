"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, QrCode, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";

const SIDE_ITEMS = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/misiones", label: "Misiones", icon: Trophy },
];
const SIDE_ITEMS_RIGHT = [
  { href: "/canjear", label: "Canjear", icon: Gift },
  { href: "/perfil", label: "Perfil", icon: User },
];
const QR_ITEM = { href: "/qr", label: "QR", icon: QrCode };

function NavIcon({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Home; active: boolean }) {
  return (
    <Link href={href} className="flex flex-1 flex-col items-center gap-1 py-1">
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-full transition-colors",
          active ? "bg-cc-green-800 text-cc-cream-50" : "text-cc-green-800/50"
        )}
      >
        <Icon className="size-[18px]" />
      </span>
      <span className={cn("text-[10px] font-medium", active ? "text-cc-green-800" : "text-cc-green-800/40")}>
        {label}
      </span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom sticky bottom-0 z-40 px-4 pb-3 sm:hidden">
      <div className="relative flex items-end justify-between rounded-[28px] bg-cc-cream-50 px-2 pt-2 pb-1 shadow-[0_8px_24px_rgba(18,40,26,0.25)]">
        {SIDE_ITEMS.map((item) => (
          <NavIcon key={item.href} {...item} active={pathname === item.href} />
        ))}

        <Link
          href={QR_ITEM.href}
          className="relative -top-5 mx-1 flex size-16 shrink-0 flex-col items-center justify-center rounded-full bg-cc-green-800 text-cc-cream-50 ring-4 ring-cc-cream-100 transition-transform active:scale-95"
        >
          <QrCode className="size-6 text-cc-gold-400" />
          <span className="mt-0.5 text-[9px] font-semibold tracking-wide">QR</span>
        </Link>

        {SIDE_ITEMS_RIGHT.map((item) => (
          <NavIcon key={item.href} {...item} active={pathname === item.href} />
        ))}
      </div>
    </nav>
  );
}

export function DesktopNav() {
  const pathname = usePathname();
  const items = [...SIDE_ITEMS, QR_ITEM, ...SIDE_ITEMS_RIGHT];

  return (
    <nav className="hidden border-b border-cc-cream-50/10 bg-cc-green-900 sm:block">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
        <Link href="/inicio" className="font-heading text-lg font-semibold text-cc-cream-50">
          Club Ciocolatto
        </Link>
        <ul className="flex items-center gap-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-cc-cream-50/10 text-cc-gold-400" : "text-cc-cream-200 hover:text-cc-cream-50"
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
