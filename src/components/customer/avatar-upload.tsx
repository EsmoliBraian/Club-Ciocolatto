"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { uploadAvatarAction, type UploadAvatarState } from "@/actions/customer-actions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const initialState: UploadAvatarState = {};

export function AvatarUpload({ avatarUrl, initials }: { avatarUrl: string | null; initials: string }) {
  const [state, formAction, pending] = useActionState(uploadAvatarAction, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const currentUrl = state.avatarUrl ?? avatarUrl;

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <form ref={formRef} action={formAction}>
      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={() => formRef.current?.requestSubmit()}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="group relative flex size-16 shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
        aria-label="Cambiar foto de perfil"
      >
        <Avatar className="size-16">
          {currentUrl && <AvatarImage src={currentUrl} alt="" />}
          <AvatarFallback className="bg-cc-gold-400 font-heading text-xl text-cc-green-900">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full bg-cc-green-800 text-cc-cream-50 ring-2 ring-background transition-transform group-hover:scale-105">
          <Pencil className="size-3" />
        </span>
      </button>
    </form>
  );
}
