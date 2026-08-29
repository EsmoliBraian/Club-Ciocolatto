import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TermsContent } from "@/components/shared/terms-content";

export const metadata: Metadata = { title: "Términos y Condiciones" };

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
      <Link href="/registro" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Volver al registro
      </Link>

      <div>
        <p className="font-logo text-lg font-semibold text-primary italic">Ciocolatto</p>
        <h1 className="mt-1 font-heading text-2xl font-semibold text-foreground">Términos y Condiciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">Club Ciocolatto — programa de fidelización</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <TermsContent />
      </div>
    </main>
  );
}
