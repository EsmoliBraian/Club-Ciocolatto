"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TermsContent } from "@/components/shared/terms-content";

export function TermsDialog() {
  return (
    <Dialog>
      <DialogTrigger className="inline bg-transparent p-0 text-primary underline-offset-2 hover:underline">
        términos y condiciones
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] gap-4 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Términos y Condiciones</DialogTitle>
        </DialogHeader>
        <TermsContent />
      </DialogContent>
    </Dialog>
  );
}
