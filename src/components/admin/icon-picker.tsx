"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { BRAND_ICON_OPTIONS } from "@/components/shared/brand-icon";
import { cn } from "@/lib/utils";

export function IconPicker({
  name,
  label = "Ícono",
  defaultValue,
}: {
  name: string;
  label?: string;
  defaultValue?: string | null;
}) {
  const [selected, setSelected] = useState(defaultValue ?? BRAND_ICON_OPTIONS[0].emoji);

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={selected} />
      <div className="grid grid-cols-5 gap-2">
        {BRAND_ICON_OPTIONS.map(({ emoji, label: iconLabel, Icon }) => {
          const active = selected === emoji;
          return (
            <button
              key={emoji}
              type="button"
              title={iconLabel}
              aria-pressed={active}
              onClick={() => setSelected(emoji)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border-2 py-2 text-[10px] text-muted-foreground transition-colors",
                active ? "border-primary bg-secondary text-foreground" : "border-transparent hover:bg-secondary/50"
              )}
            >
              <Icon size={22} weight="duotone" />
              <span className="truncate">{iconLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
