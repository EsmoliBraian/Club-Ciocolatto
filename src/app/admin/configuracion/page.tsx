import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLoyaltyConfig } from "@/server/services/config-service";
import { listActiveTiers } from "@/server/services/tier-service";
import { ConfigForm } from "@/components/admin/config-form";
import { ApiKeysManager } from "@/components/admin/api-keys-manager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfigAdminPage() {
  const [config, session, tiers] = await Promise.all([getLoyaltyConfig(), auth(), listActiveTiers()]);
  const isSuperAdmin = session?.user.role === "SUPER_ADMIN";
  const apiKeys = isSuperAdmin ? await prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } }) : [];
  const surveyResponses = config.surveyQuestion
    ? await prisma.surveyResponse.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { customerProfile: { include: { user: true } } },
      })
    : [];

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold">Configuración</h1>
      <ConfigForm config={config} tiers={tiers} />

      {config.surveyQuestion && (
        <Card>
          <CardHeader>
            <CardTitle>Respuestas de la encuesta</CardTitle>
            <CardDescription>{config.surveyQuestion}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {surveyResponses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay respuestas.</p>
            ) : (
              surveyResponses.map((r) => (
                <div key={r.id} className="rounded-lg border border-border p-2.5 text-sm">
                  <p className="font-medium text-foreground">
                    {r.customerProfile.user.firstName} {r.customerProfile.user.lastName}
                  </p>
                  <p className="text-muted-foreground">{r.answer}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

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
