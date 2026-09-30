"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { claimAnniversaryRewardAction } from "@/actions/customer-actions";

export function AnniversaryBanner() {
  const [pending, startTransition] = useTransition();

  function claim() {
    startTransition(async () => {
      const result = await claimAnniversaryRewardAction();
      if (result.success) {
        toast.success("¡Feliz aniversario! 🎉", {
          description: result.redemptionCode
            ? `Tu regalo: código ${result.redemptionCode}. +${result.pointsAwarded} puntos.`
            : `Sumaste ${result.pointsAwarded} puntos de regalo.`,
        });
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-cc-gold-400/40 bg-cc-gold-400/10 px-4 py-3">
      <div>
        <p className="font-heading text-sm font-semibold text-cc-green-900">🎉 ¡Feliz aniversario!</p>
        <p className="text-xs text-cc-green-800/80">Tenés un regalo esperándote por tu año en el Club.</p>
      </div>
      <Button size="sm" onClick={claim} disabled={pending} className="bg-cc-gold-400 text-cc-green-900 hover:bg-cc-gold-300">
        {pending ? "Reclamando…" : "Reclamar"}
      </Button>
    </div>
  );
}
