import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-cc-green-900 px-4 py-10">
      <Link href="/" className="mb-8 flex flex-col items-center gap-1 text-center">
        <span className="font-heading text-2xl font-semibold text-cc-gold-400 italic">Ciocolatto</span>
        <span className="text-xs text-cc-cream-200">Más que clientes, fanáticos.</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
