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
          <Field label="Bono dúo (ambos alcanzan el nivel)" name="referralDuoBonusPoints" type="number" defaultValue={config.referralDuoBonusPoints} required />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="referralDuoMilestoneTierId">Nivel del bono dúo</Label>
            <Select name="referralDuoMilestoneTierId" defaultValue={config.referralDuoMilestoneTierId ?? undefined}>
              <SelectTrigger id="referralDuoMilestoneTierId" className="w-full">
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

      <Card>
        <CardHeader>
          <CardTitle>Win-back (clientes inactivos)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Días de inactividad" name="winbackInactivityDays" type="number" defaultValue={config.winbackInactivityDays} required />
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
