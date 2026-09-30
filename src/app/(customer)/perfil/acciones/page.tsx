import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { listClaimsForCustomer } from "@/server/services/point-claim-service";
import { BackHeader } from "@/components/shared/back-header";
import { PointClaimForm } from "@/components/customer/point-claim-form";

export const metadata: Metadata = { title: "Sumá puntos extra" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En revisión",
  APPROVED: "Aprobada",
  REJECTED: "No aprobada",
};

export default async function PointClaimsPage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  const claims = await listClaimsForCustomer(profile.id);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <BackHeader title="Sumá puntos extra" />
      <p className="text-sm text-muted-foreground">
        Contanos qué hiciste (una reseña, una publicación en redes etiquetándonos) y un admin te suma los puntos.
      </p>
      <PointClaimForm />

      {claims.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">Tus solicitudes</h2>
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm"
            >
              <span className="text-muted-foreground">{claim.description || claim.type}</span>
              <span className="font-medium text-foreground">{STATUS_LABEL[claim.status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
