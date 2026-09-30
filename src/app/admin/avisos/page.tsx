import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listActiveTiersCached } from "@/server/services/tier-service";
import { AnnouncementForm } from "@/components/admin/announcement-form";

export const metadata: Metadata = { title: "Avisos" };

export default async function AnnouncementsAdminPage() {
  const session = await auth();
  if (session?.user.role !== "SUPER_ADMIN") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold">Avisos</h1>
        <p className="text-sm text-muted-foreground">Esta sección es solo para el superadmin.</p>
      </div>
    );
  }

  const [tiers, totalCustomers, byTier] = await Promise.all([
    listActiveTiersCached(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.customerProfile.groupBy({ by: ["tierId"], _count: { _all: true } }),
  ]);

  const tierCounts: Record<string, number> = {};
  for (const row of byTier) {
    if (row.tierId) tierCounts[row.tierId] = row._count._all;
  }

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Avisos</h1>
        <p className="text-sm text-muted-foreground">
          Mandá un mensaje a todos los clientes o a los de un nivel específico. Llega como notificación en la app y
          como push a quienes lo tengan activado.
        </p>
      </div>
      <AnnouncementForm tiers={tiers} totalCustomers={totalCustomers} tierCounts={tierCounts} />
    </div>
  );
}
