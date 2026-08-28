"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Copy, Trash2, Loader2 } from "lucide-react";
import { createApiKeyAction, revokeApiKeyAction, type CreateApiKeyState } from "@/actions/admin-actions";
import { useDialogFormAction } from "@/hooks/use-dialog-form-action";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import type { ApiKey } from "@prisma/client";

const SCOPES = [
  { value: "orders:write", label: "Registrar órdenes" },
  { value: "customers:read", label: "Leer clientes" },
  { value: "customers:write", label: "Crear clientes" },
  { value: "refunds:write", label: "Registrar reembolsos" },
];

const initialState: CreateApiKeyState = {};

export function ApiKeysManager({ apiKeys }: { apiKeys: ApiKey[] }) {
  const { state, pending, submit } = useDialogFormAction(createApiKeyAction, initialState);
  const [revokePending, startTransition] = useTransition();
  const revealedKey = state.plaintextKey;

  return (
    <div className="flex flex-col gap-4">
      {revealedKey && (
        <div className="flex flex-col gap-2 rounded-lg border border-cc-gold-400/40 bg-cc-gold-400/10 p-3 text-sm">
          <p className="font-medium">Copiá esta clave ahora — no se va a volver a mostrar.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-background px-2 py-1 text-xs">{revealedKey}</code>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(revealedKey);
                toast.success("Copiada al portapapeles");
              }}
            >
              <Copy className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {apiKeys.map((key) => (
          <div key={key.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{key.name}</p>
              <p className="text-xs text-muted-foreground">
                {key.keyPrefix}… · {(key.scopes as string[]).join(", ")}
                {key.lastUsedAt && ` · último uso ${formatDateTime(key.lastUsedAt)}`}
              </p>
            </div>
            {key.active ? (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={revokePending}
                onClick={() => startTransition(() => revokeApiKeyAction(key.id))}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Revocada</span>
            )}
          </div>
        ))}
        {apiKeys.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Sin claves creadas.</p>
        )}
      </div>

      <form action={submit} className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="apiKeyName">Nombre de la integración</Label>
          <Input id="apiKeyName" name="name" placeholder="POS Ciocolatto" required />
        </div>
        <div className="flex flex-wrap gap-3">
          {SCOPES.map((scope) => (
            <label key={scope.value} className="flex items-center gap-1.5 text-sm">
              <Checkbox name={`scope_${scope.value}`} />
              {scope.label}
            </label>
          ))}
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={pending} className="self-start">
          {pending && <Loader2 className="size-4 animate-spin" />}
          Generar clave
        </Button>
      </form>
    </div>
  );
}
