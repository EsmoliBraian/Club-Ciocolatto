"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Check, X, Loader2 } from "lucide-react";
import { submitPointClaimAction } from "@/actions/customer-actions";
import { useDialogFormAction } from "@/hooks/use-dialog-form-action";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TYPE_LABELS: Record<string, string> = {
  SOCIAL_MEDIA_POST: "Publicación en redes",
  REVIEW: "Reseña en Google",
};

const initialState: { success?: boolean; error?: string } = {};

export function PointClaimForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { state, pending, submit } = useDialogFormAction(submitPointClaimAction, initialState, () => {
    toast.success("¡Listo! Un admin va a revisarlo pronto.");
    formRef.current?.reset();
    setFileName(null);
  });

  return (
    <form ref={formRef} action={submit} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="type">¿Qué hiciste?</Label>
        <Select name="type" defaultValue="SOCIAL_MEDIA_POST">
          <SelectTrigger id="type" className="w-full">
            <SelectValue>{(value: string) => TYPE_LABELS[value] ?? value}</SelectValue>
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
        <Label>Captura (opcional)</Label>
        <input
          ref={fileInputRef}
          id="proof"
          name="proof"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        {fileName ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm">
            <span className="flex items-center gap-2 truncate text-foreground">
              <Check className="size-4 shrink-0 text-primary" />
              <span className="truncate">{fileName}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = "";
                setFileName(null);
              }}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Quitar foto"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="justify-start">
            <Camera className="size-4" />
            Elegir foto
          </Button>
        )}
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Enviar
      </Button>
    </form>
  );
}
