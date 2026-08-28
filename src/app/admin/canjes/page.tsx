import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Canjes" };

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  PENDING: { label: "Pendiente", variant: "default" },
  USED: { label: "Usado", variant: "secondary" },
  EXPIRED: { label: "Vencido", variant: "destructive" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
};

export default async function RedemptionsAdminPage() {
  const redemptions = await prisma.rewardRedemption.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { reward: true, customerProfile: { include: { user: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold">Canjes</h1>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Premio</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Puntos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {redemptions.map((r) => {
              const status = STATUS_LABEL[r.status];
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/admin/clientes/${r.customerProfileId}`} className="font-medium hover:underline">
                      {r.customerProfile.user.firstName} {r.customerProfile.user.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>{r.reward.name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.redemptionCode}</TableCell>
                  <TableCell>{r.pointsSpent}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(r.createdAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {redemptions.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay canjes.</p>
        )}
      </div>
    </div>
  );
}
