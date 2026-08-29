"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Award,
  Trophy,
  Gift,
  TicketCheck,
  Megaphone,
  UserPlus,
  Settings,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutMenuRow } from "@/components/shared/logout-menu-row";

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/niveles", label: "Niveles", icon: Award },
  { href: "/admin/misiones", label: "Misiones", icon: Trophy },
  { href: "/admin/premios", label: "Premios", icon: Gift },
  { href: "/admin/canjes", label: "Canjes", icon: TicketCheck },
  { href: "/admin/promociones", label: "Promociones", icon: Megaphone },
  { href: "/admin/referidos", label: "Referidos", icon: UserPlus },
  { href: "/admin/auditoria", label: "Auditoría", icon: ShieldCheck },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5">
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
              active
                ? "bg-cc-green-800 text-cc-cream-50 shadow-sm"
                : "text-foreground/70 hover:bg-cc-green-soft/20 hover:text-foreground"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandMark() {
  return (
    <Link href="/admin" className="mb-1 flex items-center gap-2 px-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cc-green-800 font-logo text-sm text-cc-cream-50 italic">
        C
      </span>
      <span className="font-logo text-lg text-foreground italic">Ciocolatto</span>
    </Link>
  );
}

function DownloadAppCard() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 rounded-xl bg-cc-cream-200 p-3 text-left transition-colors hover:bg-cc-green-soft/25"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cc-green-800 text-cc-cream-50">
        <Smartphone className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold text-foreground">Descargá nuestra App</span>
        <span className="block truncate text-[11px] text-muted-foreground">Disponible en iOS y Android</span>
      </span>
    </Link>
  );
}

export function AdminSidebar({ userName, userRole }: { userName: string; userRole: string }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-5 border-r border-border bg-card px-3 py-5 md:flex">
      <BrandMark />
      <div className="px-2">
        <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
        <p className="text-xs text-muted-foreground">{userRole}</p>
      </div>
      <AdminNavLinks />
      <DownloadAppCard />
      <div className="border-t border-border pt-2">
        <LogoutMenuRow variant="light" />
      </div>
    </aside>
  );
}
