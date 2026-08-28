"use client";

import { useActionState, useRef } from "react";
import { findCustomerAction, type ActionState } from "@/actions/employee-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { QrScannerButton } from "@/components/employee/qr-scanner-button";

const initialState: ActionState = {};

export function FindCustomerForm() {
  const [state, formAction] = useActionState(findCustomerAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDetected(value: string) {
    if (inputRef.current) inputRef.current.value = value;
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="query">Código QR, email o teléfono</Label>
        <Input ref={inputRef} id="query" name="query" placeholder="Escaneá o ingresá el dato del cliente" autoFocus />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton pendingText="Buscando…">Buscar cliente</SubmitButton>
      <QrScannerButton onDetected={handleDetected} />
    </form>
  );
}
