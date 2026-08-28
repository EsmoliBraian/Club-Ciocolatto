"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, Copy, Loader2 } from "lucide-react";
import { createCustomerAction, type CreateCustomerState } from "@/actions/admin-actions";
import { useDialogFormAction } from "@/hooks/use-dialog-form-action";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { FAVORITE_DRINK_OPTIONS } from "@/lib/constants";

const initialState: CreateCustomerState = {};

export function CreateCustomerDialog() {
  const [open, setOpen] = useState(false);
  const { state, pending, submit } = useDialogFormAction(createCustomerAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Nuevo cliente
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>

        {state.success ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Cuenta creada. Compartile esta contraseña temporal — no se va a volver a mostrar.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-cc-gold-400/40 bg-cc-gold-400/10 p-3">
              <code className="flex-1 overflow-x-auto text-sm">{state.tempPassword}</code>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(state.tempPassword ?? "");
                  toast.success("Copiada al portapapeles");
                }}
              >
                <Copy className="size-3.5" />
              </Button>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Cerrar
              </Button>
              <Button render={<Link href={`/admin/clientes/${state.customerId}`} />}>Ver cliente</Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={submit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Field label="Nombre" name="firstName" required />
                {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName[0]}</p>}
              </div>
              <div>
                <Field label="Apellido" name="lastName" required />
                {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName[0]}</p>}
              </div>
            </div>
            <div>
              <Field label="Email" name="email" type="email" required />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email[0]}</p>}
            </div>
            <div>
              <Field label="Teléfono" name="phone" type="tel" required />
              {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone[0]}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha de nacimiento" name="birthDate" type="date" />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="favoriteDrink">Bebida favorita</Label>
                <Select name="favoriteDrink">
                  <SelectTrigger id="favoriteDrink" className="w-full">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    {FAVORITE_DRINK_OPTIONS.map((drink) => (
                      <SelectItem key={drink} value={drink}>
                        {drink}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Crear cliente
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
