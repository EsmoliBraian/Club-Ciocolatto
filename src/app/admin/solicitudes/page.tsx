import type { Metadata } from "next";
import Link from "next/link";
import { listPendingClaims } from "@/server/services/point-claim-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PointClaimActions } from "@/components/admin/point-claim-actions";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Solicitudes" };

const TYPE_LABEL: Record<string, string> = {
  SOCIAL_MEDIA_POST: "Publicación en redes",
  REVIEW: "Reseña",
  CUSTOM: "Otro",
};

export default async function PointClaimsAdminPage() {
  const claims = await listPendingClaims();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold">Solicitudes</h1>
      <p className="text-sm text-muted-foreground">
        Reseñas y publicaciones en redes que los clientes reportaron — revisá y sumá los puntos.
      </p>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Detalle</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Puntos / Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => (
              <TableRow key={claim.id}>
                <TableCell>
                  <Link href={`/admin/clientes/${claim.customerProfileId}`} className="font-medium hover:underline">
                    {claim.customerProfile.user.firstName} {claim.customerProfile.user.lastName}
                  </Link>
                </TableCell>
                <TableCell>{TYPE_LABEL[claim.type]}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {claim.proofUrl ? (
                    <a href={claim.proofUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      Ver foto
                    </a>
                  ) : (
                    claim.description || "—"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(claim.createdAt)}</TableCell>
                <TableCell>
                  <PointClaimActions claimId={claim.id} suggestedPoints={claim.pointsRequested} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {claims.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
        )}
      </div>
    </div>
  );
}
