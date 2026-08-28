"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { saveProductAction, type ActionState } from "@/actions/admin-actions";
import { useDialogFormAction } from "@/hooks/use-dialog-form-action";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/admin/form-field";
import type { Product } from "@prisma/client";

const initialState: ActionState = {};

export function ProductFormDialog({ product }: { product?: Product }) {
  const [open, setOpen] = useState(false);
  const { state, pending, submit } = useDialogFormAction(saveProductAction, initialState, () => {
    toast.success(product ? "Producto actualizado." : "Producto creado.");
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          product ? (
            <Button variant="ghost" size="icon-sm">
              <Pencil className="size-3.5" />
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" />
              Nuevo producto
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{product ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <form action={submit} className="flex flex-col gap-3">
          {product && <input type="hidden" name="id" value={product.id} />}
          <Field label="Nombre" name="name" defaultValue={product?.name} required />
          <Field label="Categoría" name="category" defaultValue={product?.category ?? undefined} />
          <Field label="Precio" name="price" type="number" step="0.01" defaultValue={Number(product?.price ?? 0)} required />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Multiplicador de puntos"
              name="pointsMultiplier"
              type="number"
              step="0.1"
              defaultValue={Number(product?.pointsMultiplier ?? 1)}
            />
            <Field label="Puntos bonus" name="bonusPoints" type="number" defaultValue={product?.bonusPoints ?? 0} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="active" defaultChecked={product?.active ?? true} />
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
