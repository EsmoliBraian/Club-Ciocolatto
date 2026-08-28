"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareReferral({ code, appUrl }: { code: string; appUrl: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${appUrl}/registro?ref=${code}`;
  const text = `Sumate al Club Ciocolatto con mi código ${code} y ganemos puntos juntos ☕`;

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Club Ciocolatto", text, url: link });
        return;
      } catch {
        // user cancelled the native share sheet — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Enlace copiado");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button onClick={share} className="w-full">
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      Compartir
    </Button>
  );
}
