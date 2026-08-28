"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { saveMissionAction, type ActionState } from "@/actions/admin-actions";
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
import type { Mission, Product } from "@prisma/client";

const initialState: ActionState = {};

const TYPE_LABELS: Record<string, string> = {
  PURCHASE_COUNT: "Cantidad de compras",
  VISIT_COUNT: "Cantidad de visitas",
  SPEND_AMOUNT: "Monto gastado",
  PRODUCT_PURCHASE: "Compra de producto",
  CATEGORY_PURCHASE: "Compra por categoría",
  REFERRAL: "Referido",
  SPECIAL_DATE: "Fecha especial",
  RAINY_DAY: "Día de lluvia",
  CUSTOM: "Personalizada",
};

export function MissionFormDialog({ mission, products }: { mission?: Mission; products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(mission?.type ?? "PURCHASE_COUNT");
  const { state, pending, submit } = useDialogFormAction(saveMissionAction, initialState, () => {
    toast.success(mission ? "Misión actualizada." : "Misión creada.");
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          mission ? (
            <Button variant="ghost" size="icon-sm">
              <Pencil className="size-3.5" />
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" />
              Nueva misión
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mission ? "Editar misión" : "Nueva misión"}</DialogTitle>
        </DialogHeader>
        <form action={submit} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
          {mission && <input type="hidden" name="id" value={mission.id} />}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" name="name" defaultValue={mission?.name} required />
            <Field label="Ícono" name="icon" defaultValue={mission?.icon ?? undefined} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" defaultValue={mission?.description} required rows={2} />
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
          {type === "PRODUCT_PURCHASE" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="productId">Producto</Label>
              <Select name="productId" defaultValue={mission?.productId ?? undefined}>
                <SelectTrigger id="productId" className="w-full">
                  <SelectValue placeholder="Elegí un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {type === "CATEGORY_PURCHASE" && (
            <Field label="Categoría" name="category" defaultValue={mission?.category ?? undefined} />
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Objetivo" name="targetValue" type="number" defaultValue={mission?.targetValue ?? 1} required />
            <Field label="Recompensa (puntos)" name="rewardPoints" type="number" defaultValue={mission?.rewardPoints ?? 0} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Fecha inicio"
              name="startAt"
              type="date"
              defaultValue={mission?.startAt?.toISOString().slice(0, 10)}
            />
            <Field
              label="Fecha fin"
              name="endAt"
              type="date"
              defaultValue={mission?.endAt?.toISOString().slice(0, 10)}
            />
          </div>
          <Field label="Límite por usuario" name="perUserLimit" type="number" defaultValue={mission?.perUserLimit ?? 1} />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="active" defaultChecked={mission?.active ?? true} />
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
