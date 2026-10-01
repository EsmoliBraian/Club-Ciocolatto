"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { saveRewardAction, type ActionState } from "@/actions/admin-actions";
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
import { IconPicker } from "@/components/admin/icon-picker";
import type { LoyaltyTier, Reward } from "@prisma/client";

const initialState: ActionState = {};

export function RewardFormDialog({ reward, tiers }: { reward?: Reward; tiers: LoyaltyTier[] }) {
  const [open, setOpen] = useState(false);
  const { state, pending, submit } = useDialogFormAction(saveRewardAction, initialState, () => {
    toast.success(reward ? "Premio actualizado." : "Premio creado.");
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          reward ? (
            <Button variant="ghost" size="icon-sm">
              <Pencil className="size-3.5" />
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" />
              Nuevo premio
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{reward ? "Editar premio" : "Nuevo premio"}</DialogTitle>
        </DialogHeader>
        <form action={submit} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
          {reward && <input type="hidden" name="id" value={reward.id} />}
          <Field label="Nombre" name="name" defaultValue={reward?.name} required />
          <IconPicker name="icon" defaultValue={reward?.icon} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" defaultValue={reward?.description ?? undefined} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Puntos" name="pointsCost" type="number" defaultValue={reward?.pointsCost} required />
            <Field label="Stock (vacío = ilimitado)" name="stock" type="number" defaultValue={reward?.stock ?? undefined} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Categoría</Label>
            <Select name="category" defaultValue={reward?.category ?? "PRODUCT"}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue>{(value: string) => (value === "PRODUCT" ? "Producto" : "Descuento")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRODUCT">Producto</SelectItem>
                <SelectItem value="DISCOUNT">Descuento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="requiredTierId">Nivel requerido</Label>
            <Select name="requiredTierId" defaultValue={reward?.requiredTierId ?? undefined}>
              <SelectTrigger id="requiredTierId" className="w-full">
                <SelectValue placeholder="Sin restricción">
                  {(value: string | null) => (value ? tiers.find((t) => t.id === value)?.name ?? value : "Sin restricción")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Límite por usuario"
              name="perUserLimit"
              type="number"
              defaultValue={reward?.perUserLimit ?? undefined}
            />
            <Field
              label="Vence"
              name="validUntil"
              type="date"
              defaultValue={reward?.validUntil?.toISOString().slice(0, 10)}
            />
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Reglas 2026 (opcional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Visitas mínimas"
                name="minimumVisits"
                type="number"
                defaultValue={reward?.minimumVisits ?? undefined}
              />
              <Field
                label="Compra mínima ($)"
                name="minimumPurchaseAmount"
                type="number"
                defaultValue={reward?.minimumPurchaseAmount ? Number(reward.minimumPurchaseAmount) : undefined}
              />
              <Field
                label="Descuento (%)"
                name="discountPct"
                type="number"
                step="0.01"
                defaultValue={reward?.discountPct ? Number(reward.discountPct) : undefined}
              />
              <Field
                label="Descuento fijo ($)"
                name="discountFixedAmount"
                type="number"
                defaultValue={reward?.discountFixedAmount ? Number(reward.discountFixedAmount) : undefined}
              />
              <Field
                label="Tope del descuento ($)"
                name="discountCapAmount"
                type="number"
                defaultValue={reward?.discountCapAmount ? Number(reward.discountCapAmount) : undefined}
              />
              <Field
                label="Tope precio de lista ($)"
                name="maxProductPrice"
                type="number"
                defaultValue={reward?.maxProductPrice ? Number(reward.maxProductPrice) : undefined}
              />
            </div>
            <p className="mt-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Datos internos (nunca se muestran al socio)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Precio de lista ($)"
                name="internalListPrice"
                type="number"
                defaultValue={reward?.internalListPrice ? Number(reward.internalListPrice) : undefined}
              />
              <Field
                label="Tope de costo ($)"
                name="internalCostCap"
                type="number"
                defaultValue={reward?.internalCostCap ? Number(reward.internalCostCap) : undefined}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="internalNotes">Notas internas</Label>
              <Textarea id="internalNotes" name="internalNotes" defaultValue={reward?.internalNotes ?? undefined} rows={2} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="active" defaultChecked={reward?.active ?? true} />
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
