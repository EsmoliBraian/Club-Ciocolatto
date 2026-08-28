import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/rbac";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const userName = `${session.user.firstName} ${session.user.lastName}`;
  const userRole = session.user.role === "SUPER_ADMIN" ? "Super Admin" : "Admin";

  return (
    <div className="flex min-h-full flex-1 bg-background">
      <AdminSidebar userName={userName} userRole={userRole} />
      <div className="flex flex-1 flex-col">
        <AdminHeader userName={userName} userRole={userRole} />
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
