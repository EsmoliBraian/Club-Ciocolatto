"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type RequestPasswordResetState } from "@/actions/auth-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";

const initialState: RequestPasswordResetState = {};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialState);

  if (state.submitted) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="font-heading text-xl font-semibold">Revisá tu email</h1>
        <p className="text-sm text-muted-foreground">
          Si existe una cuenta con ese email, te enviamos un link para restablecer tu contraseña. Puede tardar
          unos minutos en llegar.
        </p>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Volver a iniciar sesión
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
        <h1 className="font-heading text-xl font-semibold">¿Olvidaste tu contraseña?</h1>
        <p className="text-sm text-muted-foreground">
          Ingresá tu email y te mandamos un link para elegir una nueva.
        </p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="vos@ejemplo.com" />
      </div>

      <SubmitButton className="mt-1 h-10 w-full" pendingText="Enviando…">
        Enviar link
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
