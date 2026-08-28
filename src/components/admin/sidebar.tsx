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
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/niveles", label: "Niveles", icon: Award },
  { href: "/admin/misiones", label: "Misiones", icon: Trophy },
  { href: "/admin/premios", label: "Premios", icon: Gift },
  { href: "/admin/canjes", label: "Canjes", icon: TicketCheck },
  { href: "/admin/promociones", label: "Promociones", icon: Megaphone },
  { href: "/admin/productos", label: "Productos", icon: Package },
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
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              active ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-4 md:flex">
      <Link href="/admin" className="mb-6 px-2 font-heading text-lg font-semibold text-cc-green-800">
        Club Ciocolatto
      </Link>
      <AdminNavLinks />
    </aside>
  );
}
