"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";
import { approvePointClaimAction, rejectPointClaimAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PointClaimActions({ claimId, suggestedPoints }: { claimId: string; suggestedPoints: number }) {
  const [points, setPoints] = useState(suggestedPoints);
  const [pending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      const result = await approvePointClaimAction(claimId, points);
      if (result.error) toast.error(result.error);
      else toast.success("Solicitud aprobada.");
    });
  }

  function reject() {
    startTransition(async () => {
      const result = await rejectPointClaimAction(claimId);
      if (result.error) toast.error(result.error);
      else toast.success("Solicitud rechazada.");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        value={points}
        onChange={(e) => setPoints(Number(e.target.value))}
        className="w-20"
        disabled={pending}
      />
      <Button size="icon-sm" variant="outline" onClick={approve} disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
      </Button>
      <Button size="icon-sm" variant="outline" onClick={reject} disabled={pending}>
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
