"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { submitPointClaimAction } from "@/actions/customer-actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";

const TYPE_LABELS: Record<string, string> = {
  SOCIAL_MEDIA_POST: "Publicación en redes",
  REVIEW: "Reseña en Google",
};

const initialState: { success?: boolean; error?: string } = {};

export function PointClaimForm() {
  const [state, formAction] = useActionState(submitPointClaimAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("¡Listo! Un admin va a revisarlo pronto.");
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="type">¿Qué hiciste?</Label>
        <Select name="type" defaultValue="SOCIAL_MEDIA_POST">
          <SelectTrigger id="type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Contanos (link a tu publicación, o qué reseña dejaste)</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="proof">Captura (opcional)</Label>
        <Input id="proof" name="proof" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton pendingText="Enviando…">Enviar</SubmitButton>
    </form>
  );
}
