"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AdminNavLinks } from "@/components/admin/sidebar";
import { LogoutMenuRow } from "@/components/shared/logout-menu-row";

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
        <Menu className="size-5" />
        <span className="sr-only">Abrir menú</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 flex-col bg-cc-green-900 px-3 py-4 text-cc-cream-50">
        <SheetHeader className="px-2 py-0">
          <SheetTitle
            render={
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="font-heading text-lg text-cc-gold-400 italic"
              />
            }
          >
            Ciocolatto
          </SheetTitle>
        </SheetHeader>
        <AdminNavLinks onNavigate={() => setOpen(false)} />
        <div className="mt-2 border-t border-cc-cream-50/10 pt-2">
          <LogoutMenuRow variant="dark" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
