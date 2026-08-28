"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Loader2 } from "lucide-react";
import { findCustomerIdByQueryAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QrScannerButton } from "@/components/employee/qr-scanner-button";

export function ScanCustomerButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function lookup(value: string) {
    setError(null);
    startTransition(async () => {
      const result = await findCustomerIdByQueryAction(value);
      if ("error" in result) {
        setError(result.error);
      } else {
        setOpen(false);
        router.push(`/admin/clientes/${result.id}`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <QrCode className="size-4" />
        Escanear QR
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Escanear cliente</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input ref={inputRef} placeholder="Código QR, email o teléfono" />
            <Button
              type="button"
              disabled={pending}
              onClick={() => inputRef.current && lookup(inputRef.current.value)}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Buscar"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <QrScannerButton onDetected={lookup} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
