"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LoyaltyTier } from "@prisma/client";

/**
 * Split out as its own client component because the label-resolving
 * children function passed to SelectValue can't be passed from a Server
 * Component — functions aren't serializable across that boundary.
 */
export function TierFilterSelect({ tiers, defaultValue }: { tiers: LoyaltyTier[]; defaultValue: string }) {
  return (
    <Select name="tier" defaultValue={defaultValue}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder="Nivel">
          {(value: string) => (value === "all" ? "Todos" : tiers.find((t) => t.slug === value)?.name ?? value)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos</SelectItem>
        {tiers.map((t) => (
          <SelectItem key={t.id} value={t.slug}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
