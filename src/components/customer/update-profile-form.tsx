"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/customer-actions";
import { useDialogFormAction } from "@/hooks/use-dialog-form-action";
import { Field } from "@/components/admin/form-field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { User } from "@prisma/client";
import { FAVORITE_DRINK_OPTIONS } from "@/lib/constants";

export function UpdateProfileForm({
  user,
}: {
  user: Pick<User, "firstName" | "lastName" | "phone" | "birthDate" | "email" | "favoriteDrink">;
}) {
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="favoriteDrink">Tu bebida favorita</Label>
        <Select name="favoriteDrink" defaultValue={user.favoriteDrink ?? undefined} required>
          <SelectTrigger id="favoriteDrink" className="w-full">
            <SelectValue placeholder="Elegí una opción" />
          </SelectTrigger>
          <SelectContent>
            {FAVORITE_DRINK_OPTIONS.map((drink) => (
              <SelectItem key={drink} value={drink}>
                {drink}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.favoriteDrink && <p className="text-xs text-destructive">{errors.favoriteDrink[0]}</p>}
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Guardar cambios
      </Button>
    </form>
  );
}
