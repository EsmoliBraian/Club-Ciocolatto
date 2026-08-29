import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";
import { getOrderHistory } from "@/server/services/order-service";
import { BackHeader } from "@/components/shared/back-header";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Historial de puntos recibidos" };

export default async function PurchaseHistoryPage() {
  const session = await auth();
  const profile = await getCustomerProfileByUserId(session!.user.id);
  if (!profile) return null;

  const orders = await getOrderHistory(profile.id);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <BackHeader title="Historial de puntos recibidos" />

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Todavía no tenés visitas registradas.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="flex flex-col gap-2 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                  {order.status === "REFUNDED" && <Badge variant="secondary">Reembolsada</Badge>}
                </div>
                {order.items.length > 0 && (
                  <p className="text-sm">
                    {order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}
                  </p>
                )}
                <p className="font-heading font-semibold text-primary">+{order.pointsEarned} puntos</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
