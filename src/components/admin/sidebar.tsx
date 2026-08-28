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
import { LogoutMenuRow } from "@/components/shared/logout-menu-row";

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
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-cc-cream-50 text-cc-green-800"
                : "text-cc-cream-200 hover:bg-cc-cream-50/10 hover:text-cc-cream-50"
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

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-cc-green-900 px-3 py-4 md:flex">
      <Link href="/admin" className="mb-6 px-3 font-heading text-xl font-semibold text-cc-gold-400 italic">
        Ciocolatto
      </Link>
      <AdminNavLinks />
      <div className="mt-2 border-t border-cc-cream-50/10 pt-2">
        <LogoutMenuRow variant="dark" />
      </div>
    </aside>
  );
}
