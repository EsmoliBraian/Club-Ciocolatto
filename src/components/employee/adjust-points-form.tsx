"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { adjustPointsAction, type ActionState } from "@/actions/employee-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/shared/submit-button";

const initialState: ActionState = {};

export function AdjustPointsForm({
  customerProfileId,
  allowNegative,
}: {
  customerProfileId: string;
  allowNegative: boolean;
}) {
  const [state, formAction] = useActionState(adjustPointsAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Puntos actualizados.");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="customerProfileId" value={customerProfileId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="amount">Puntos {allowNegative ? "(+ para sumar, − para restar)" : "a sumar"}</Label>
        <Input id="amount" name="amount" type="number" step="1" required placeholder={allowNegative ? "-50" : "50"} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reason">Motivo</Label>
        <Textarea id="reason" name="reason" required placeholder="Obligatorio — queda registrado en auditoría." rows={2} />
      </div>
      <SubmitButton pendingText="Guardando…" variant="secondary">
        Aplicar ajuste
      </SubmitButton>
    </form>
  );
}
