"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { claimBirthdayRewardAction } from "@/actions/customer-actions";

export function BirthdayBanner() {
  const [pending, startTransition] = useTransition();

  function claim() {
    startTransition(async () => {
      const result = await claimBirthdayRewardAction();
      if (result.success) {
        toast.success("¡Feliz cumpleaños! 🎂", {
          description: `Sumaste ${result.pointsAwarded} puntos de regalo.`,
        });
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-cc-gold-400/40 bg-cc-gold-400/10 px-4 py-3">
      <div>
        <p className="font-heading text-sm font-semibold">🎂 ¡Feliz cumpleaños!</p>
        <p className="text-xs text-muted-foreground">Tenemos un regalo para vos.</p>
      </div>
      <Button size="sm" onClick={claim} disabled={pending} className="bg-cc-gold-400 text-cc-green-900 hover:bg-cc-gold-300">
        {pending ? "Reclamando…" : "Reclamar"}
      </Button>
    </div>
  );
}
