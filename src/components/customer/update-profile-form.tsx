"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/customer-actions";
import { useDialogFormAction } from "@/hooks/use-dialog-form-action";
import { Field } from "@/components/admin/form-field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { User } from "@prisma/client";

export function UpdateProfileForm({ user }: { user: Pick<User, "firstName" | "lastName" | "phone" | "birthDate" | "email"> }) {
  const { state, pending, submit } = useDialogFormAction(updateProfileAction, {});

  useEffect(() => {
    if (state.success) toast.success("Datos actualizados.");
  }, [state.success]);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={submit} className="flex flex-col gap-3 rounded-2xl bg-cc-cream-50 p-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre" name="firstName" defaultValue={user.firstName} required />
        <Field label="Apellido" name="lastName" defaultValue={user.lastName} required />
      </div>
      {errors.firstName && <p className="text-xs text-destructive">{errors.firstName[0]}</p>}

      <div className="flex flex-col gap-1.5">
        <Label>Email</Label>
        <Input value={user.email} disabled />
        <p className="text-xs text-muted-foreground">El email no se puede cambiar.</p>
      </div>

      <Field label="Teléfono" name="phone" type="tel" defaultValue={user.phone ?? undefined} required />
      {errors.phone && <p className="text-xs text-destructive">{errors.phone[0]}</p>}

      <Field
        label="Fecha de nacimiento"
        name="birthDate"
        type="date"
        defaultValue={user.birthDate?.toISOString().slice(0, 10)}
        required
      />
      {errors.birthDate && <p className="text-xs text-destructive">{errors.birthDate[0]}</p>}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Guardar cambios
      </Button>
    </form>
  );
}
