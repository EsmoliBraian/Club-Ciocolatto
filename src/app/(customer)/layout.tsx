import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { BottomNav, DesktopNav } from "@/components/customer/bottom-nav";

export default async function CustomerLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") {
    redirect("/login");
  }

  const profile = await getCustomerProfileByUserId(session.user.id);
  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-cc-cream-100">
      <DesktopNav />
      <div className="flex-1 pb-4">{children}</div>
      <BottomNav />
    </div>
  );
}
