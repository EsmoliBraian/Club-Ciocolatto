import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES } from "@/lib/rbac";
import { listMissionLinkedProducts } from "@/server/services/mission-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RegisterPurchaseForm } from "@/components/employee/register-purchase-form";
import { AdjustPointsForm } from "@/components/employee/adjust-points-form";

export const metadata: Metadata = { title: "Cliente" };

export default async function EmployeeCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const [profile, missionProducts] = await Promise.all([
    prisma.customerProfile.findUnique({
      where: { id },
      include: { user: true, tier: true },
    }),
    listMissionLinkedProducts(),
  ]);
  if (!profile) notFound();

  const allowNegative = ADMIN_ROLES.includes(session!.user.role);

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardContent className="flex items-center justify-between gap-3 py-5">
          <div className="flex items-center gap-3">
            <Avatar className="size-11">
              <AvatarFallback className="bg-cc-green-800 font-heading text-cc-cream-50">
                {profile.user.firstName[0]}
                {profile.user.lastName[0] ?? ""}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">
                {profile.user.firstName} {profile.user.lastName}
              </p>
              <Badge variant="secondary" className="mt-0.5">
                {profile.tier?.name ?? "Amigo Ciocolatto"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-xl font-bold text-primary">
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
          <RegisterPurchaseForm customerProfileId={profile.id} missionProducts={missionProducts} />
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
