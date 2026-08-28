"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AdminNavLinks } from "@/components/admin/sidebar";
import { LogoutMenuRow } from "@/components/shared/logout-menu-row";

export function AdminMobileNav({ userName, userRole }: { userName: string; userRole: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
        <Menu className="size-5" />
        <span className="sr-only">Abrir menú</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 flex-col gap-4 bg-card px-3 py-5">
        <SheetHeader className="px-2 py-0">
          <SheetTitle
            render={
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 font-logo text-lg text-foreground italic"
              />
            }
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-cc-green-800 text-xs text-cc-cream-50 not-italic">
              C
            </span>
            Ciocolatto
          </SheetTitle>
        </SheetHeader>
        <div className="px-2">
          <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
          <p className="text-xs text-muted-foreground">{userRole}</p>
        </div>
        <AdminNavLinks onNavigate={() => setOpen(false)} />
        <div className="border-t border-border pt-2">
          <LogoutMenuRow variant="light" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
