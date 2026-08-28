import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/rbac";
import { LogoutButton } from "@/components/shared/logout-button";

export default async function EmployeeLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user || !STAFF_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-cc-cream-100">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/empleado" className="font-heading text-lg font-semibold text-cc-green-800">
            Club Ciocolatto · Mostrador
          </Link>
          <span className="text-sm text-muted-foreground">
            {session.user.firstName} {session.user.lastName}
          </span>
        </div>
      </header>
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</div>
      <div className="mx-auto w-full max-w-2xl px-4 pb-6">
        <LogoutButton />
      </div>
    </div>
  );
}
