"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { registerPurchaseAction, type RegisterPurchaseState } from "@/actions/employee-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";

const initialState: RegisterPurchaseState = {};

export function RegisterPurchaseForm({ customerProfileId }: { customerProfileId: string }) {
  const [state, formAction] = useActionState(registerPurchaseAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success(
        state.alreadyProcessed ? "Esta venta ya había sido registrada." : `¡Compra registrada! +${state.pointsEarned} puntos`
      );
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="customerProfileId" value={customerProfileId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="totalAmount">Monto</Label>
        <Input id="totalAmount" name="totalAmount" type="number" min={1} step="1" required placeholder="0" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="paymentMethod">Método de pago</Label>
          <Input id="paymentMethod" name="paymentMethod" placeholder="Efectivo, tarjeta…" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="externalReference">N° de ticket</Label>
          <Input id="externalReference" name="externalReference" placeholder="Opcional" />
        </div>
      </div>
      <SubmitButton pendingText="Registrando…">Registrar compra</SubmitButton>
    </form>
  );
}
