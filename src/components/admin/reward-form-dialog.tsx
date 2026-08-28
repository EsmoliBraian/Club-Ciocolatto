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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" defaultValue={reward?.description ?? undefined} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Puntos" name="pointsCost" type="number" defaultValue={reward?.pointsCost} required />
            <Field label="Stock (vacío = ilimitado)" name="stock" type="number" defaultValue={reward?.stock ?? undefined} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="requiredTierId">Nivel requerido</Label>
            <Select name="requiredTierId" defaultValue={reward?.requiredTierId ?? undefined}>
              <SelectTrigger id="requiredTierId" className="w-full">
                <SelectValue placeholder="Sin restricción" />
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
