"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
] as const;

export function ThemeChoiceCards() {
  const { theme, setTheme } = useTheme();
  // `theme` is briefly undefined on first client render (next-themes reads
  // localStorage after mount) — defaulting to "light" here just picks which
  // card looks selected for that instant, it doesn't set the actual theme.
  const current = theme ?? "light";

  return (
    <div className="grid grid-cols-2 gap-3">
      {OPTIONS.map((opt) => {
        const active = current === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 rounded-xl border-2 py-3.5 text-sm font-medium transition-colors",
              active ? "border-primary bg-secondary text-foreground" : "border-border text-muted-foreground hover:bg-secondary/50"
            )}
          >
            {active && <Check className="absolute top-2 right-2 size-3.5 text-primary" />}
            <opt.icon className="size-5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
