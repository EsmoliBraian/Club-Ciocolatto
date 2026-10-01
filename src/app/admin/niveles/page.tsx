import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TierFormDialog } from "@/components/admin/tier-form-dialog";
import { BrandIcon } from "@/components/shared/brand-icon";

export const metadata: Metadata = { title: "Niveles" };

export default async function TiersAdminPage() {
  const tiers = await prisma.loyaltyTier.findMany({
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { customers: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Niveles</h1>
          <p className="text-sm text-muted-foreground">
            El umbral se calcula con los puntos de compra de los últimos 12 meses (no de por vida).
          </p>
        </div>
        <TierFormDialog />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nivel</TableHead>
              <TableHead>Umbral (12 meses)</TableHead>
              <TableHead>Multiplicador</TableHead>
              <TableHead>Beneficios</TableHead>
              <TableHead>Clientes</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((tier) => {
              const benefits = Array.isArray(tier.benefits) ? (tier.benefits as string[]) : [];
              return (
                <TableRow key={tier.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <BrandIcon emoji={tier.icon} size={22} color={tier.color ?? undefined} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-semibold">{tier.name}</span>
                          {!tier.active && <Badge variant="secondary">Inactivo</Badge>}
                        </div>
                        {tier.description && (
                          <p className="text-xs text-muted-foreground">{tier.description}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {tier.maximumPoints
                      ? `${tier.minimumPoints.toLocaleString("es-AR")}–${tier.maximumPoints.toLocaleString("es-AR")} pts`
                      : `${tier.minimumPoints.toLocaleString("es-AR")}+ pts`}
                  </TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {Number(tier.earnMultiplier) === 1 ? "—" : `+${Math.round((Number(tier.earnMultiplier) - 1) * 100)}%`}
                  </TableCell>
                  <TableCell className="max-w-xs min-w-48">
                    <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                      {benefits.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="tabular-nums">{tier._count.customers}</TableCell>
                  <TableCell className="text-right">
                    <TierFormDialog tier={tier} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
