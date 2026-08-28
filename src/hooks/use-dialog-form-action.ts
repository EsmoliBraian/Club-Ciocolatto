"use client";

import { useState, useTransition } from "react";

/**
 * Runs a server action from a dialog form without the `useActionState` +
 * `useEffect(() => { if (state.success) setOpen(false) })` pattern — the
 * latter calls setState synchronously inside an effect body, which
 * eslint-plugin-react-hooks' purity rules (React Compiler-era) now flag.
 * Awaiting the action directly inside the transition lets success handling
 * (closing the dialog, toasting) run as a normal consequence of the event,
 * not as an effect reacting to state.
 */
export function useDialogFormAction<TState extends { success?: boolean; error?: string }>(
  action: (prevState: TState, formData: FormData) => Promise<TState>,
  initialState: TState,
  onSuccess?: (state: TState) => void
) {
  const [state, setState] = useState<TState>(initialState);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await action(state, formData);
      setState(result);
      if (result.success) onSuccess?.(result);
    });
  }

  return { state, pending, submit };
}
