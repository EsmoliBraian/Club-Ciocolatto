"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { submitSurveyResponseAction } from "@/actions/customer-actions";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/shared/submit-button";

const initialState: { success?: boolean; error?: string } = {};

export function SurveyCard({ question }: { question: string }) {
  const [state, formAction] = useActionState(submitSurveyResponseAction, initialState);

  useEffect(() => {
    if (state.success) toast.success("¡Gracias por tu opinión!");
  }, [state.success]);

  if (state.success) return null;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <MessageCircle className="size-4 text-primary" />
        <p className="font-medium text-foreground">{question}</p>
      </div>
      <Textarea name="answer" rows={2} placeholder="Escribí tu respuesta…" required />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton size="sm" className="self-start" pendingText="Enviando…">
        Enviar
      </SubmitButton>
    </form>
  );
}
