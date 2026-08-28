import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Auditoría" };

export default async function AuditLogAdminPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { actor: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold">Auditoría</h1>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-muted-foreground">{formatDateTime(log.createdAt)}</TableCell>
                <TableCell>{log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : "Sistema"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{log.action}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {log.entityType}
                  {log.entityId ? ` · ${log.entityId.slice(0, 10)}…` : ""}
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{log.reason ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {logs.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Sin actividad registrada todavía.</p>
        )}
      </div>
    </div>
  );
}
