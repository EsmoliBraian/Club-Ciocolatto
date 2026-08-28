import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Referidos" };

export default async function ReferralsAdminPage() {
  const referrals = await prisma.referral.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      referrer: { include: { user: true } },
      referee: { include: { user: true } },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold">Referidos</h1>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invita</TableHead>
              <TableHead>Invitado</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Puntos otorgados</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link href={`/admin/clientes/${r.referrerId}`} className="font-medium hover:underline">
                    {r.referrer.user.firstName} {r.referrer.user.lastName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/clientes/${r.refereeId}`} className="hover:underline">
                    {r.referee.user.firstName} {r.referee.user.lastName}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs">{r.codeUsed}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "COMPLETED" ? "default" : "secondary"}>
                    {r.status === "COMPLETED" ? "Completado" : r.status === "PENDING" ? "Pendiente" : "Rechazado"}
                  </Badge>
                </TableCell>
                <TableCell>{r.referrerPointsAwarded + r.refereePointsAwarded}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(r.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {referrals.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay referidos.</p>
        )}
      </div>
    </div>
  );
}
