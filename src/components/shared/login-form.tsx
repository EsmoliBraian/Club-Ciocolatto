"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/actions/auth-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";

const initialState: ActionState = {};

export function LoginForm({ callbackUrl, registered }: { callbackUrl?: string; registered?: boolean }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div>
        <h1 className="font-heading text-xl font-semibold">Bienvenido de nuevo</h1>
        <p className="text-sm text-muted-foreground">Ingresá a tu cuenta del Club Ciocolatto.</p>
      </div>

      {registered && (
        <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          Cuenta creada. Iniciá sesión para continuar.
        </p>
      )}
      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required placeholder="vos@ejemplo.com" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <Link href="/olvide-password" className="text-xs font-medium text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      <SubmitButton className="mt-2 h-10 w-full" pendingText="Ingresando…">
        Iniciar sesión
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/registro" className="font-medium text-primary hover:underline">
          Creá una
        </Link>
      </p>
    </form>
  );
}
