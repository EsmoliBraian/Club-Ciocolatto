"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { Product } from "@prisma/client";
import { registerPurchaseAction, type RegisterPurchaseState } from "@/actions/employee-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";

const initialState: RegisterPurchaseState = {};

export function RegisterPurchaseForm({
  customerProfileId,
  missionProducts,
}: {
  customerProfileId: string;
  missionProducts: Product[];
}) {
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
        <p className="text-xs text-muted-foreground">Los puntos se calculan sobre este monto.</p>
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

      {missionProducts.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
          <Label>¿Consumió algo de esto? (opcional, para avanzar sus misiones)</Label>
          <div className="flex flex-col gap-2">
            {missionProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3">
                <span className="text-sm">{product.name}</span>
                <Input
                  name={`qty_${product.id}`}
                  type="number"
                  min={0}
                  step="1"
                  defaultValue={0}
                  className="w-16 text-center"
                  aria-label={`Cantidad de ${product.name}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <SubmitButton pendingText="Registrando…">Registrar compra</SubmitButton>
    </form>
  );
}
