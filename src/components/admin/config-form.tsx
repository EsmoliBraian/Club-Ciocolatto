"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateConfigAction, type ActionState } from "@/actions/admin-actions";
import { Field } from "@/components/admin/form-field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/shared/submit-button";
import type { LoyaltyConfig, LoyaltyTier } from "@prisma/client";

const initialState: ActionState = {};

export function ConfigForm({ config, tiers }: { config: LoyaltyConfig; tiers: LoyaltyTier[] }) {
  const [state, formAction] = useActionState(updateConfigAction, initialState);

  useEffect(() => {
    if (state.success) toast.success("Configuración guardada.");
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Fidelización</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="$ por punto" name="amountPerPoint" type="number" step="0.01" defaultValue={Number(config.amountPerPoint)} required />
          <Field label="Puntos por ese monto" name="pointsPerAmount" type="number" step="0.01" defaultValue={Number(config.pointsPerAmount)} required />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Puntos por evento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Registro" name="registrationPoints" type="number" defaultValue={config.registrationPoints} required />
          <Field label="Primera compra" name="firstPurchasePoints" type="number" defaultValue={config.firstPurchasePoints} required />
          <Field label="Cumpleaños" name="birthdayPoints" type="number" defaultValue={config.birthdayPoints} required />
          <Field label="Aniversario de socio" name="anniversaryPoints" type="number" defaultValue={config.anniversaryPoints} required />
          <Field label="Perfil completo" name="profileCompletionPoints" type="number" defaultValue={config.profileCompletionPoints} required />
          <Field label="Puntos vencen a los (días, vacío = nunca)" name="pointsExpireAfterDays" type="number" defaultValue={config.pointsExpireAfterDays ?? undefined} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Encuesta</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="surveyQuestion">Pregunta (vacío = encuesta apagada)</Label>
            <Textarea id="surveyQuestion" name="surveyQuestion" defaultValue={config.surveyQuestion ?? ""} rows={2} />
          </div>
          <Field label="Puntos por responder" name="surveyPoints" type="number" defaultValue={config.surveyPoints} required />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referidos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Puntos para quien invita" name="referralSponsorPoints" type="number" defaultValue={config.referralSponsorPoints} required />
          <Field label="Puntos para el invitado" name="referralRefereePoints" type="number" defaultValue={config.referralRefereePoints} required />
          <Field
            label="Compra mínima del invitado para acreditar ($)"
            name="referralMinPurchaseAmount"
            type="number"
            defaultValue={Number(config.referralMinPurchaseAmount)}
            required
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Win-back (clientes inactivos)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Días de inactividad" name="winbackInactivityDays" type="number" defaultValue={config.winbackInactivityDays} required />
          <Field label="Tope del cupón ($)" name="winbackDiscountCap" type="number" defaultValue={Number(config.winbackDiscountCap)} required />
          <Field label="Vigencia del cupón (días)" name="winbackValidDays" type="number" defaultValue={config.winbackValidDays} required />
          <Field
            label="Mínimo entre envíos (días)"
            name="winbackMaxFrequencyDays"
            type="number"
            defaultValue={config.winbackMaxFrequencyDays}
            required
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="winbackMinimumTierId">Nivel mínimo</Label>
            <Select name="winbackMinimumTierId" defaultValue={config.winbackMinimumTierId ?? undefined}>
              <SelectTrigger id="winbackMinimumTierId" className="w-full">
                <SelectValue placeholder="Sin nivel (desactivado)">
                  {(value: string | null) => (value ? tiers.find((t) => t.id === value)?.name ?? value : "Sin nivel (desactivado)")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle>Reglas 2026 (rebalanceo)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="activationDate">
              Fecha de activación (vacío = reglas nuevas todavía apagadas)
            </Label>
            <input
              id="activationDate"
              name="activationDate"
              type="date"
              defaultValue={config.activationDate ? config.activationDate.toISOString().slice(0, 10) : undefined}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Desde este momento el nivel de todos los socios (nuevos y existentes) se calcula
              por sus compras de los últimos 12 meses, no por puntos de por vida — puede subir o
              bajar. Los puntos que ya tenían no vencen nunca; los que ganen de ahora en más sí,
              según &ldquo;Puntos vencen a los (días)&rdquo;.
            </p>
          </div>
          <Field label="Días de gracia (catálogo viejo)" name="gracePeriodDays" type="number" defaultValue={config.gracePeriodDays} required />
          <Field
            label="Monto mínimo para contar como visita ($)"
            name="visitMinimumAmount"
            type="number"
            defaultValue={Number(config.visitMinimumAmount)}
            required
          />
          <Field label="Visitas para desbloquear box sorpresa" name="boxUnlockVisits" type="number" defaultValue={config.boxUnlockVisits} required />
          <Field
            label="Visitas mínimas para el regalo de aniversario"
            name="anniversaryMinVisits"
            type="number"
            defaultValue={config.anniversaryMinVisits}
            required
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Canjes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field
            label="Vencimiento del código (horas)"
            name="redemptionCodeExpiryHours"
            type="number"
            defaultValue={config.redemptionCodeExpiryHours}
            required
          />
          <Field
            label="Cooldown por beneficio (días, vacío = sin límite)"
            name="rewardCooldownDays"
            type="number"
            defaultValue={config.rewardCooldownDays ?? undefined}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Nombre del negocio" name="businessName" defaultValue={config.businessName} required />
          <Field label="Logo (URL)" name="logoUrl" defaultValue={config.logoUrl ?? undefined} />
          <Field label="Email de contacto" name="contactEmail" type="email" defaultValue={config.contactEmail ?? undefined} />
          <Field label="Teléfono" name="contactPhone" defaultValue={config.contactPhone ?? undefined} />
          <Field label="Instagram (URL)" name="instagramUrl" defaultValue={config.instagramUrl ?? undefined} />
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton className="self-start" pendingText="Guardando…">
        Guardar configuración
      </SubmitButton>
    </form>
  );
}
