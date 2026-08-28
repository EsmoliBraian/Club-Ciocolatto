import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLoyaltyConfig } from "@/server/services/config-service";
import { ConfigForm } from "@/components/admin/config-form";
import { ApiKeysManager } from "@/components/admin/api-keys-manager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfigAdminPage() {
  const [config, session] = await Promise.all([getLoyaltyConfig(), auth()]);
  const isSuperAdmin = session?.user.role === "SUPER_ADMIN";
  const apiKeys = isSuperAdmin ? await prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } }) : [];

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold">Configuración</h1>
      <ConfigForm config={config} />

      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Integración POS</CardTitle>
            <CardDescription>
              Claves de API para conectar el punto de venta de Ciocolatto. Solo Super Admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApiKeysManager apiKeys={apiKeys} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
