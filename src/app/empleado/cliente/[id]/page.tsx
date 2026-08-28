import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterPurchaseForm } from "@/components/employee/register-purchase-form";
import { AdjustPointsForm } from "@/components/employee/adjust-points-form";

export const metadata: Metadata = { title: "Cliente" };

export default async function EmployeeCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const profile = await prisma.customerProfile.findUnique({
    where: { id },
    include: { user: true, tier: true },
  });
  if (!profile) notFound();

  const allowNegative = ADMIN_ROLES.includes(session!.user.role);

  return (
    <div className="flex flex-col gap-5">
      <Card className="bg-cc-green-800 text-cc-cream-50">
        <CardContent className="flex items-center justify-between py-5">
          <div>
            <p className="font-heading text-lg font-semibold">
              {profile.user.firstName} {profile.user.lastName}
            </p>
            <p className="text-sm text-cc-gold-300">{profile.tier?.name ?? "Amigo Ciocolatto"}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xl font-bold">
            <Star className="size-5 fill-cc-gold-400 text-cc-gold-400" />
            {profile.pointsBalance}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registrar compra</CardTitle>
        </CardHeader>
        <CardContent>
          <RegisterPurchaseForm customerProfileId={profile.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agregar / ajustar puntos</CardTitle>
        </CardHeader>
        <CardContent>
          <AdjustPointsForm customerProfileId={profile.id} allowNegative={allowNegative} />
        </CardContent>
      </Card>
    </div>
  );
}
