"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { validateRedemptionAction, type ValidateRedemptionState } from "@/actions/employee-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";

const initialState: ValidateRedemptionState = {};

export function ValidateRedemptionForm() {
  const [state, formAction] = useActionState(validateRedemptionAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">Código de canje</Label>
        <Input
          id="code"
          name="code"
          required
          autoFocus
          className="text-center font-heading text-lg tracking-widest uppercase"
          placeholder="XXXXXXXX"
        />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>
            Validado: <strong>{state.rewardName}</strong> para {state.customerName}.
          </span>
        </div>
      )}
      <SubmitButton pendingText="Validando…">Validar canje</SubmitButton>
    </form>
  );
}
