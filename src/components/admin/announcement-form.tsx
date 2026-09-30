"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { sendAnnouncementAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { LoyaltyTier } from "@prisma/client";

const TITLE_MAX = 60;
const BODY_MAX = 200;

export function AnnouncementForm({
  tiers,
  totalCustomers,
  tierCounts,
}: {
  tiers: LoyaltyTier[];
  totalCustomers: number;
  tierCounts: Record<string, number>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const recipientCount = audience === "ALL" ? totalCustomers : tierCounts[audience] ?? 0;
  const tierName = audience === "ALL" ? null : tiers.find((t) => t.id === audience)?.name;
  const canSend = title.trim().length > 0 && body.trim().length > 0 && recipientCount > 0;

  function confirmSend() {
    startTransition(async () => {
      const result = await sendAnnouncementAction(title, body, audience === "ALL" ? null : audience);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Aviso enviado a ${result.recipientCount} cliente${result.recipientCount === 1 ? "" : "s"}.`);
      setTitle("");
      setBody("");
      setAudience("ALL");
      setOpen(false);
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="announcement-title">Título</Label>
        <Input
          id="announcement-title"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
          placeholder="Ej: ¡Nuevo horario de fin de semana!"
        />
        <p className="text-right text-xs text-muted-foreground">
          {title.length}/{TITLE_MAX}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="announcement-body">Mensaje</Label>
        <Textarea
          id="announcement-body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
          rows={3}
          placeholder="Ej: Ahora abrimos los domingos de 9 a 13hs."
        />
        <p className="text-right text-xs text-muted-foreground">
          {body.length}/{BODY_MAX}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="announcement-audience">Destinatarios</Label>
        <Select value={audience} onValueChange={(value) => setAudience(value ?? "ALL")}>
          <SelectTrigger id="announcement-audience" className="w-full">
            <SelectValue>
              {(value: string) =>
                value === "ALL" ? "Todos los clientes" : tiers.find((t) => t.id === value)?.name ?? value
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los clientes</SelectItem>
            {tiers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {recipientCount === 0
            ? "Todavía no hay clientes en este grupo."
            : `Va a llegar a ${recipientCount} cliente${recipientCount === 1 ? "" : "s"}.`}
        </p>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          render={
            <Button disabled={!canSend} className="self-start">
              <Send className="size-4" />
              Enviar aviso
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Enviar este aviso?</AlertDialogTitle>
            <AlertDialogDescription>
              Se manda ya mismo, como notificación en la app y como push a quienes lo tengan activado. No se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-secondary px-4 py-3">
              <p className="font-medium text-foreground">{title || "(sin título)"}</p>
              <p className="text-muted-foreground">{body || "(sin mensaje)"}</p>
            </div>
            <p className="text-muted-foreground">
              Destinatarios: <span className="font-medium text-foreground">{tierName ?? "Todos los clientes"}</span>{" "}
              ({recipientCount})
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSend} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Confirmar envío"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
