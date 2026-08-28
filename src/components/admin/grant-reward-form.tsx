"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { grantRewardAction, type ActionState } from "@/actions/admin-actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import type { Reward } from "@prisma/client";

const initialState: ActionState = {};

export function GrantRewardForm({ customerProfileId, rewards }: { customerProfileId: string; rewards: Reward[] }) {
  const [state, formAction] = useActionState(grantRewardAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Beneficio enviado.");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="customerProfileId" value={customerProfileId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rewardId">Premio</Label>
        <Select name="rewardId" required>
          <SelectTrigger id="rewardId" className="w-full">
            <SelectValue placeholder="Elegí un premio" />
          </SelectTrigger>
          <SelectContent>
            {rewards.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="grant-reason">Motivo</Label>
        <Textarea id="grant-reason" name="reason" required rows={2} placeholder="Obligatorio — queda en auditoría." />
      </div>
      <SubmitButton variant="secondary" pendingText="Enviando…">
        Enviar beneficio
      </SubmitButton>
    </form>
  );
}
