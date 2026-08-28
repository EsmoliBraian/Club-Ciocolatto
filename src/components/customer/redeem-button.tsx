"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { redeemRewardAction } from "@/actions/customer-actions";

export function RedeemButton({
  rewardId,
  rewardName,
  pointsCost,
  pointsBalance,
  disabled,
  size = "default",
}: {
  rewardId: string;
  rewardName: string;
  pointsCost: number;
  pointsBalance: number;
  disabled?: boolean;
  size?: "default" | "sm";
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function confirmRedeem() {
    startTransition(async () => {
      const result = await redeemRewardAction(rewardId);
      if (result.success) {
        toast.success("¡Beneficio obtenido! 🎉", {
          description: `Código: ${result.redemptionCode} — mostralo en caja.`,
        });
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button size={size === "sm" ? "sm" : "default"} disabled={disabled}>
            Canjear
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Querés canjear este beneficio?</AlertDialogTitle>
          <AlertDialogDescription>Vas a usar puntos de tu saldo disponible.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
            <span className="font-medium text-foreground">{rewardName}</span>
            <span className="font-semibold text-cc-gold-400">{pointsCost} pts</span>
          </div>
          <p className="text-muted-foreground">
            Tu saldo: <span className="font-medium text-foreground">{pointsBalance} puntos</span>
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmRedeem} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Confirmar canje"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
