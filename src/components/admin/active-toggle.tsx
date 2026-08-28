"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";

export function ActiveToggle({
  id,
  active,
  onToggle,
}: {
  id: string;
  active: boolean;
  onToggle: (id: string, active: boolean) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      checked={active}
      disabled={pending}
      onCheckedChange={(checked) => startTransition(() => onToggle(id, checked))}
    />
  );
}
