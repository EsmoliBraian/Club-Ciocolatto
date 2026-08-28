import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TierFormDialog } from "@/components/admin/tier-form-dialog";

export const metadata: Metadata = { title: "Niveles" };

export default async function TiersAdminPage() {
  const tiers = await prisma.loyaltyTier.findMany({
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { customers: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Niveles</h1>
        <TierFormDialog />
      </div>

      <div className="flex flex-col gap-3">
        {tiers.map((tier) => (
          <Card key={tier.id}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tier.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-heading font-semibold">{tier.name}</p>
                    {!tier.active && <Badge variant="secondary">Inactivo</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tier.maximumPoints ? `${tier.minimumPoints}–${tier.maximumPoints} puntos` : `${tier.minimumPoints}+ puntos`}
                    {" · "}
                    {tier._count.customers} clientes
                  </p>
                </div>
              </div>
              <TierFormDialog tier={tier} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
