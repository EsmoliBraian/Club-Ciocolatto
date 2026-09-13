"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Pencil, X } from "lucide-react";
import { uploadAvatarAction, type UploadAvatarState } from "@/actions/customer-actions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

const initialState: UploadAvatarState = {};

export function AvatarUpload({ avatarUrl, initials }: { avatarUrl: string | null; initials: string }) {
  const [state, formAction, pending] = useActionState(uploadAvatarAction, initialState);
  const [zoomOpen, setZoomOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const currentUrl = state.avatarUrl ?? avatarUrl;

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  function openPicker() {
    inputRef.current?.click();
  }

  return (
    <>
      <form ref={formRef} action={formAction}>
        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
        <div className="relative flex size-16 shrink-0">
          <button
            type="button"
            onClick={() => (currentUrl ? setZoomOpen(true) : openPicker())}
            disabled={pending}
            className="flex size-16 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
            aria-label={currentUrl ? "Ver foto de perfil" : "Agregar foto de perfil"}
          >
            <Avatar className="size-16">
              {currentUrl && <AvatarImage src={currentUrl} alt="" />}
              <AvatarFallback className="bg-cc-gold-400 font-heading text-xl text-cc-green-900">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openPicker();
            }}
            disabled={pending}
            className="absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full bg-cc-green-800 text-cc-cream-50 ring-2 ring-background transition-transform hover:scale-105 disabled:opacity-60"
            aria-label="Cambiar foto de perfil"
          >
            <Pencil className="size-3" />
          </button>
        </div>
      </form>

      {currentUrl && (
        <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
          <DialogContent
            showCloseButton={false}
            className="flex max-w-[min(92vw,420px)] items-center justify-center border-none bg-transparent p-0 shadow-none ring-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- full-res lightbox view, not a layout-sized thumbnail */}
            <img
              src={currentUrl}
              alt="Tu foto de perfil"
              className="aspect-square w-full rounded-2xl object-cover"
            />
            <DialogClose
              aria-label="Cerrar"
              className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
            >
              <X className="size-4" />
            </DialogClose>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
