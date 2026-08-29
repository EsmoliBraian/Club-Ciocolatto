"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/actions/auth-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { FAVORITE_DRINK_OPTIONS } from "@/lib/constants";

const initialState: ActionState = {};

export function RegisterForm({ referralCode }: { referralCode?: string }) {
  const [state, formAction] = useActionState(registerAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div>
        <h1 className="font-heading text-xl font-semibold">Creá tu cuenta</h1>
        <p className="text-sm text-muted-foreground">Sumate al Club Ciocolatto en un minuto.</p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName">Nombre</Label>
          <Input id="firstName" name="firstName" required autoComplete="given-name" />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName[0]}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName">Apellido</Label>
          <Input id="lastName" name="lastName" required autoComplete="family-name" />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName[0]}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
        {errors.email && <p className="text-xs text-destructive">{errors.email[0]}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="+54 9 11 1234 5678" />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone[0]}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="birthDate">Fecha de nacimiento</Label>
        <Input id="birthDate" name="birthDate" type="date" required />
        {errors.birthDate && <p className="text-xs text-destructive">{errors.birthDate[0]}</p>}
        <p className="text-xs text-muted-foreground">
          Te vamos a regalar un café gratis el día de tu cumpleaños 🎂
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="favoriteDrink">Tu bebida favorita</Label>
        <Select name="favoriteDrink" required>
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" />
        {errors.password ? (
          <ul className="list-disc pl-4 text-xs text-destructive">
            {errors.password.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            Mínimo 8 caracteres, con una mayúscula, una minúscula y un número.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="referralCode">Código de invitación (opcional)</Label>
        <Input
          id="referralCode"
          name="referralCode"
          defaultValue={referralCode}
          className="uppercase"
          placeholder="Ej: BRAIAN50"
        />
        {errors.referralCode && <p className="text-xs text-destructive">{errors.referralCode[0]}</p>}
      </div>

      <div className="flex flex-col gap-2.5 pt-1">
        <label className="flex items-start gap-2 text-sm">
          <Checkbox name="acceptedTerms" required className="mt-0.5" />
          <span>
            Acepto los{" "}
            <Link href="/terminos" className="text-primary hover:underline">
              términos y condiciones
            </Link>{" "}
            y la política de privacidad.
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <Checkbox name="acceptedMarketing" className="mt-0.5" />
          <span>Quiero recibir novedades y promociones de Ciocolatto.</span>
        </label>
      </div>

      <SubmitButton className="mt-2 h-10 w-full" pendingText="Creando cuenta…">
        Crear cuenta
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </form>
  );
}
