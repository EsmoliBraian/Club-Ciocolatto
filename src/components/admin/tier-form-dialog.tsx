"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { saveTierAction, type ActionState } from "@/actions/admin-actions";
import { useDialogFormAction } from "@/hooks/use-dialog-form-action";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/admin/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { LoyaltyTier } from "@prisma/client";

const initialState: ActionState = {};

export function TierFormDialog({ tier }: { tier?: LoyaltyTier }) {
  const [open, setOpen] = useState(false);
  const { state, pending, submit } = useDialogFormAction(saveTierAction, initialState, () => {
    toast.success(tier ? "Nivel actualizado." : "Nivel creado.");
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          tier ? (
            <Button variant="ghost" size="icon-sm">
              <Pencil className="size-3.5" />
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" />
              Nuevo nivel
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tier ? "Editar nivel" : "Nuevo nivel"}</DialogTitle>
        </DialogHeader>
        <form action={submit} className="flex flex-col gap-3">
          {tier && <input type="hidden" name="id" value={tier.id} />}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" name="name" defaultValue={tier?.name} required />
            <Field label="Slug" name="slug" defaultValue={tier?.slug} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Ícono" name="icon" defaultValue={tier?.icon ?? undefined} />
            <Field label="Mín. puntos" name="minimumPoints" type="number" defaultValue={tier?.minimumPoints} required />
            <Field label="Máx. puntos" name="maximumPoints" type="number" defaultValue={tier?.maximumPoints ?? undefined} />
          </div>
          <Field label="Descripción" name="description" defaultValue={tier?.description ?? undefined} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="benefits">Beneficios (uno por línea)</Label>
            <Textarea
              id="benefits"
              name="benefits"
              rows={4}
              defaultValue={Array.isArray(tier?.benefits) ? (tier.benefits as string[]).join("\n") : ""}
            />
          </div>
          <Field label="Orden" name="displayOrder" type="number" defaultValue={tier?.displayOrder ?? 0} />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="active" defaultChecked={tier?.active ?? true} />
            Activo
          </label>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
