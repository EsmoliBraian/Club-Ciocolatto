"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
import { ADMIN_NAV_ITEMS } from "@/components/admin/sidebar";
import { logoutAction } from "@/actions/auth-actions";

function useBreadcrumb() {
  const pathname = usePathname();
  const current = [...ADMIN_NAV_ITEMS].reverse().find((item) => pathname.startsWith(item.href));
  const isDetail = current && pathname !== current.href;
  return { section: current?.label ?? "Dashboard", isDetail };
}

export function AdminHeader({ userName, userRole }: { userName: string; userRole: string }) {
  const { section, isDetail } = useBreadcrumb();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/admin/clientes?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
      <AdminMobileNav userName={userName} userRole={userRole} />

      <nav className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
        <Link href="/admin" className="hover:text-foreground">
          Admin
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{section}</span>
        {isDetail && (
          <>
            <ChevronRight className="size-3.5" />
            <span>Detalle</span>
          </>
        )}
      </nav>

      <form onSubmit={handleSearch} className="ml-auto hidden max-w-xs flex-1 sm:block">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </form>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="size-8">
                <AvatarFallback className="bg-cc-green-800 text-xs text-cc-cream-50">{initials}</AvatarFallback>
              </Avatar>
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            <p className="truncate font-medium text-foreground">{userName}</p>
            <p className="text-xs font-normal text-muted-foreground">{userRole}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/admin/configuracion" />}>Configuración</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => logoutAction()}>
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
