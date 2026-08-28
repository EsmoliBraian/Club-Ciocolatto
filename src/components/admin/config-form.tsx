"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateConfigAction, type ActionState } from "@/actions/admin-actions";
import { Field } from "@/components/admin/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/shared/submit-button";
import type { LoyaltyConfig } from "@prisma/client";

const initialState: ActionState = {};

export function ConfigForm({ config }: { config: LoyaltyConfig }) {
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
          <Field label="Puntos vencen a los (días, vacío = nunca)" name="pointsExpireAfterDays" type="number" defaultValue={config.pointsExpireAfterDays ?? undefined} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referidos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Puntos para quien invita" name="referralSponsorPoints" type="number" defaultValue={config.referralSponsorPoints} required />
          <Field label="Puntos para el invitado" name="referralRefereePoints" type="number" defaultValue={config.referralRefereePoints} required />
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
