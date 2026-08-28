import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/rbac";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
import { LogoutButton } from "@/components/shared/logout-button";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 bg-cc-cream-100">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-3 sm:gap-3 sm:px-6">
          <AdminMobileNav />
          <p className="flex-1 truncate text-sm text-muted-foreground">
            {session.user.firstName} {session.user.lastName} ·{" "}
            {session.user.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
          </p>
          <div className="w-auto sm:w-40">
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
