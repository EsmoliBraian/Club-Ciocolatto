"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AdminNavLinks } from "@/components/admin/sidebar";

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
        <Menu className="size-5" />
        <span className="sr-only">Abrir menú</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 px-3 py-4">
        <SheetHeader className="px-2 py-0">
          <SheetTitle
            render={
              <Link href="/admin" onClick={() => setOpen(false)} className="font-heading text-lg text-cc-green-800" />
            }
          >
            Club Ciocolatto
          </SheetTitle>
        </SheetHeader>
        <AdminNavLinks onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
