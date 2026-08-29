"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type ResetPasswordState } from "@/actions/auth-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);
  const errors = state.fieldErrors ?? {};

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="font-heading text-xl font-semibold">¡Listo!</h1>
        <p className="text-sm text-muted-foreground">Tu contraseña se actualizó. Ya podés iniciar sesión.</p>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <div>
        <h1 className="font-heading text-xl font-semibold">Elegí tu nueva contraseña</h1>
      </div>

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
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

      <SubmitButton className="mt-1 h-10 w-full" pendingText="Guardando…">
        Guardar contraseña
      </SubmitButton>
    </form>
  );
}
