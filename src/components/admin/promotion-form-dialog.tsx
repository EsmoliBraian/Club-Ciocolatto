"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { savePromotionAction, type ActionState } from "@/actions/admin-actions";
import { useDialogFormAction } from "@/hooks/use-dialog-form-action";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/admin/form-field";
import type { Promotion } from "@prisma/client";

const initialState: ActionState = {};

const TYPE_LABELS: Record<string, string> = {
  POINTS_MULTIPLIER: "Multiplicador de puntos",
  BONUS_POINTS: "Puntos bonus fijos",
  DISCOUNT: "Descuento",
};

function toDateInput(d?: Date | null) {
  return d ? d.toISOString().slice(0, 10) : undefined;
}

export function PromotionFormDialog({ promotion }: { promotion?: Promotion }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(promotion?.type ?? "BONUS_POINTS");
  const { state, pending, submit } = useDialogFormAction(savePromotionAction, initialState, () => {
    toast.success(promotion ? "Promoción actualizada." : "Promoción creada.");
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          promotion ? (
            <Button variant="ghost" size="icon-sm">
              <Pencil className="size-3.5" />
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" />
              Nueva promoción
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{promotion ? "Editar promoción" : "Nueva promoción"}</DialogTitle>
        </DialogHeader>
        <form action={submit} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
          {promotion && <input type="hidden" name="id" value={promotion.id} />}
          <Field label="Nombre" name="name" defaultValue={promotion?.name} required />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" defaultValue={promotion?.description ?? undefined} rows={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">Tipo</Label>
            <Select name="type" defaultValue={type} onValueChange={(v) => setType(v as typeof type)}>
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
          {type === "POINTS_MULTIPLIER" && (
            <Field
              label="Multiplicador (ej: 2 = x2)"
              name="multiplier"
              type="number"
              step="0.1"
              defaultValue={promotion?.multiplier ? Number(promotion.multiplier) : 2}
            />
          )}
          {type === "BONUS_POINTS" && (
            <Field label="Puntos bonus" name="bonusPoints" type="number" defaultValue={promotion?.bonusPoints ?? 50} />
          )}
          {type === "DISCOUNT" && (
            <Field
              label="Descuento (%)"
              name="discountPct"
              type="number"
              defaultValue={promotion?.discountPct ? Number(promotion.discountPct) : 10}
            />
          )}
          <Field label="Categoría (opcional)" name="category" defaultValue={promotion?.category ?? undefined} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde" name="startAt" type="date" defaultValue={toDateInput(promotion?.startAt)} required />
            <Field label="Hasta" name="endAt" type="date" defaultValue={toDateInput(promotion?.endAt)} required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="active" defaultChecked={promotion?.active ?? true} />
            Activa
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
